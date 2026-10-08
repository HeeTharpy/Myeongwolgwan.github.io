let managers = [];
let photoData = [];
let photoBusy = false;
let loaded = false;

const db = window.mwDb;
const auth = firebase.auth();
const ADMIN_EMAIL = "admin@myeongwolgwan.com";

const $ = id => document.getElementById(id);
const clean = value => String(value || "").trim();

$("loginBtn").onclick = async () => {
  const id = clean($("loginId").value);
  const password = $("loginPw").value;

  if (id !== "myeongwol") {
    alert("아이디 또는 비밀번호가 틀렸습니다.");
    return;
  }

  try {
    $("loginBtn").disabled = true;
    $("loginBtn").textContent = "로그인 중...";

    await auth.signInWithEmailAndPassword(ADMIN_EMAIL, password);

  } catch (error) {
    console.error("Firebase 로그인 오류:", error);

    alert(
      "로그인 오류\n\n" +
      "코드: " + error.code + "\n" +
      "내용: " + error.message
    );

  } finally {
    $("loginBtn").disabled = false;
    $("loginBtn").textContent = "로그인";
  }
};

$("loginPw").addEventListener("keydown", event => {
  if (event.key === "Enter") $("loginBtn").click();
});

auth.onAuthStateChanged(user => {
  if (user) {
    $("loginBox").hidden = true;
    $("adminWrap").hidden = false;

    if (!loaded) {
      loaded = true;
      load();
    }
  } else {
    $("loginBox").hidden = false;
    $("adminWrap").hidden = true;
  }
});

function normalize(value) {
  return Array.isArray(value)
    ? value.filter(Boolean)
    : value
      ? Object.values(value)
      : [];
}

function load() {
  db.child("managers").on("value", snapshot => {
    managers = normalize(snapshot.val());
    render();
  });
}

function currentPhotos(manager){
  if(!manager)return [];
  const photos=Array.isArray(manager.photos)?manager.photos.filter(Boolean):[];
  return [...new Set(photos.length?photos:[manager.image].filter(Boolean))].slice(0,4);
}
function compress(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/'))return reject(new Error('이미지 파일만 등록할 수 있습니다.'));
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('사진을 읽지 못했습니다.'));
    reader.onload=event=>{
      const image=new Image();
      image.onerror=()=>reject(new Error('이미지를 열지 못했습니다.'));
      image.onload=()=>{
        const canvas=document.createElement('canvas');
        const scale=Math.min(1,900/image.width,1200/image.height);
        canvas.width=Math.max(1,Math.round(image.width*scale));
        canvas.height=Math.max(1,Math.round(image.height*scale));
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        let result='';
        for(const quality of [0.72,0.62,0.5,0.4]){
          result=canvas.toDataURL('image/jpeg',quality);
          if(result.length<=220000)break;
        }
        if(result.length>220000)return reject(new Error('사진 용량이 큽니다. 더 작은 사진을 선택해주세요.'));
        resolve(result);
      };
      image.src=event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
function renderPreview(){
  const preview=$('preview');
  if(!photoData.length){preview.textContent='사진 미리보기';return;}
  preview.innerHTML='';
  photoData.forEach((src,index)=>{
    const card=document.createElement('div');card.className='photo-preview-card';
    const image=document.createElement('img');image.src=src;image.alt=`사진 ${index+1}`;
    const label=document.createElement('span');label.textContent=index===0?'대표사진':`사진 ${index+1}`;
    const actions=document.createElement('div');actions.className='photo-preview-actions';
    const buttons=[['◀',()=>shiftPhoto(index,-1)],['▶',()=>shiftPhoto(index,1)],['삭제',()=>removePhoto(index)]];
    buttons.forEach(([title,fn],i)=>{
      const button=document.createElement('button');button.type='button';button.textContent=title;
      button.setAttribute('aria-label',i===2?`사진 ${index+1} 삭제`:`사진 ${index+1} 순서 변경`);
      button.disabled=(i===0&&index===0)||(i===1&&index===photoData.length-1);
      button.addEventListener('click',fn);actions.appendChild(button);
    });
    card.append(image,label,actions);preview.appendChild(card);
  });
}
function shiftPhoto(index,step){const next=index+step;if(next<0||next>=photoData.length)return;[photoData[index],photoData[next]]=[photoData[next],photoData[index]];renderPreview()}
function removePhoto(index){photoData.splice(index,1);renderPreview()}
$('photo').onchange=async event=>{
  const files=Array.from(event.target.files||[]);if(!files.length)return;
  if(photoData.length+files.length>4){alert('사진은 최대 4장까지 등록할 수 있습니다.');event.target.value='';return;}
  photoBusy=true;$('saveBtn').disabled=true;
  try{
    for(const file of files){photoData.push(await compress(file));renderPreview();}
  }catch(error){alert(error.message||'사진을 처리하지 못했습니다.');}
  finally{photoBusy=false;$('saveBtn').disabled=false;event.target.value='';renderPreview();}
};

function clear() {
  [
    "managerId",
    "name",
    "age",
    "height",
    "body",
    "work",
    "intro"
  ].forEach(id => {
    $(id).value = "";
  });

  $("photo").value = "";
  photoData = [];
  renderPreview();
}

$("clearBtn").onclick = clear;

$("saveBtn").onclick = async () => {
  if(photoBusy)return;
  const name = clean($("name").value);

  if (!name) {
    alert("이름을 입력해주세요.");
    return;
  }

  const id = clean($("managerId").value);

  const old = id
    ? managers.find(manager => String(manager.id) === id)
    : null;

  const item = {
    id: id || String(Date.now()),
    name,
    age: clean($("age").value),
    height: clean($("height").value),
    body: clean($("body").value),
    work: clean($("work").value),
    intro: clean($("intro").value),
    image: photoData[0] || "",
    photos: [...photoData]
  };

  if (id) {
    const index = managers.findIndex(
      manager => String(manager.id) === id
    );

    if(index<0){alert("수정할 프로필을 찾지 못했습니다.");return;}
    managers[index] = {...old,...item};
  } else {
    managers.push(item);
  }

  try {
    await save();
    clear();
    alert("프로필이 저장되었습니다.");

  } catch (error) {
    console.error("Firebase 저장 오류:", error);

    alert(
      "저장 오류\n\n" +
      "코드: " + error.code + "\n" +
      "내용: " + error.message
    );
  }
};

async function save() {
  await db.child("managers").set(managers);
}

function edit(id) {
  const manager = managers.find(
    item => String(item.id) === String(id)
  );

  if (!manager) return;

  [
    "name",
    "age",
    "height",
    "body",
    "work",
    "intro"
  ].forEach(key => {
    $(key).value = manager[key] || "";
  });

  $("managerId").value = manager.id;
  photoData = currentPhotos(manager);
  renderPreview();

  scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function del(id) {
  if (!confirm("이 프로필을 삭제할까요?")) return;

  managers = managers.filter(
    item => String(item.id) !== String(id)
  );

  try {
    await save();

  } catch (error) {
    console.error("Firebase 삭제 오류:", error);

    alert(
      "삭제 오류\n\n" +
      "코드: " + error.code + "\n" +
      "내용: " + error.message
    );
  }
}

async function move(id, direction) {
  const index = managers.findIndex(
    item => String(item.id) === String(id)
  );

  const next = index + direction;

  if (
    index < 0 ||
    next < 0 ||
    next >= managers.length
  ) return;

  [managers[index], managers[next]] =
    [managers[next], managers[index]];

  try {
    await save();

  } catch (error) {
    console.error("Firebase 순서변경 오류:", error);

    alert(
      "변경 오류\n\n" +
      "코드: " + error.code + "\n" +
      "내용: " + error.message
    );
  }
}

function render() {
  $("count").textContent = managers.length + "명";

  $("managerList").innerHTML = managers.length
    ? managers.map((manager, index) => `
      <article class="manager">

        <div>
          ${
            manager.image
              ? `<img src="${manager.image}" alt="">`
              : "사진 없음"
          }
        </div>

        <div>
          <strong>${manager.name}</strong>

          <span>
            ${manager.age || "나이 문의"} ·
            ${manager.height || "키 문의"} ·
            ${manager.work || "출근시간 문의"}
          </span>
        </div>

        <div>
          <button
            onclick="move('${manager.id}', -1)"
            ${index === 0 ? "disabled" : ""}
          >
            ▲
          </button>

          <button
            onclick="move('${manager.id}', 1)"
            ${index === managers.length - 1 ? "disabled" : ""}
          >
            ▼
          </button>

          <button onclick="edit('${manager.id}')">
            수정
          </button>

          <button
            class="delete"
            onclick="del('${manager.id}')"
          >
            삭제
          </button>
        </div>

      </article>
    `).join("")
    : "<p>등록된 프로필이 없습니다.</p>";
}

window.edit = edit;
window.del = del;
window.move = move;