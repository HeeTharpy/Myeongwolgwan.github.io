let managers = [];
let photoData = "";
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

function compress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = reject;

    reader.onload = event => {
      const image = new Image();

      image.onerror = reject;

      image.onload = () => {
        const scale = Math.min(1, 1000 / image.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };

      image.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

$("photo").onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;

  $("preview").textContent = "사진 처리 중...";

  try {
    photoData = await compress(file);
    $("preview").innerHTML =
      `<img src="${photoData}" alt="미리보기">`;
  } catch {
    alert("사진을 처리하지 못했습니다.");
  }
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
  photoData = "";
  $("preview").textContent = "사진 미리보기";
}

$("clearBtn").onclick = clear;

$("saveBtn").onclick = async () => {
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
    image: photoData || (old && old.image) || ""
  };

  if (id) {
    const index = managers.findIndex(
      manager => String(manager.id) === id
    );

    managers[index] = item;
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
  photoData = "";

  $("preview").innerHTML = manager.image
    ? `<img src="${manager.image}" alt="미리보기">`
    : "사진 미리보기";

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