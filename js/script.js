const KEY = "contacthub_contacts";
const $ = (id) => document.getElementById(id);
const RX = {
  name: /^[A-Za-z\u0600-\u06FF ]{2,50}$/,
  phone: /^(\+20|0020|0)?1[0125]\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
};
let contacts = [];
try {
  contacts = JSON.parse(localStorage.getItem(KEY)) || [];
} catch (e) {
  contacts = [];
}
let editId = null,
  photo = "";
const modal = new bootstrap.Modal($("contactModal"));
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
});

const save = () => localStorage.setItem(KEY, JSON.stringify(contacts));
const esc = (s) => {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
};
const initials = (n) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
const avatar = (c, cls = "") =>
  `<div class="avatar ${cls}">${c.photo ? `<img src="${c.photo}" alt="">` : esc(initials(c.name))}</div>`;

function render() {
  const q = $("searchInput").value.trim().toLowerCase();
  const list = contacts.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email || "").toLowerCase().includes(q),
  );

  $("totalCount").textContent = contacts.length;
  $("favCount").textContent = contacts.filter((c) => c.fav).length;
  $("emCount").textContent = contacts.filter((c) => c.em).length;
  $("allSub").textContent =
    `Manage and organize your ${contacts.length} contact${contacts.length === 1 ? "" : "s"}`;

  $("contactsList").innerHTML = list.length
    ? list
        .map(
          (c) => `
    <div class="col-md-6" data-id="${c.id}">
      <div class="c-card">
        <div class="d-flex align-items-center gap-3 mb-2">
          ${avatar(c)}
          <div>
            <div class="c-name">${esc(c.name)}</div>
            <div class="d-flex flex-wrap gap-1 mt-1">${c.group ? `<span class="chip">${esc(c.group)}</span>` : ""}${c.em ? '<span class="chip em">Emergency</span>' : ""}</div>
          </div>
        </div>
        <div class="info"><i class="fa-solid fa-phone"></i>${esc(c.phone)}</div>
        ${c.email ? `<div class="info"><i class="fa-solid fa-envelope"></i>${esc(c.email)}</div>` : ""}
        ${c.address ? `<div class="info"><i class="fa-solid fa-location-dot"></i>${esc(c.address)}</div>` : ""}
        ${c.notes ? `<div class="info"><i class="fa-solid fa-note-sticky"></i>${esc(c.notes)}</div>` : ""}
        <div class="d-flex flex-wrap gap-2 mt-auto pt-3">
          <a class="act call" href="tel:${esc(c.phone)}" title="Call"><i class="fa-solid fa-phone"></i></a>
          ${c.email ? `<a class="act" href="mailto:${esc(c.email)}" title="Email"><i class="fa-solid fa-envelope"></i></a>` : ""}
          <button class="act fav ${c.fav ? "on" : ""}" data-a="fav" title="Favorite"><i class="fa-${c.fav ? "solid" : "regular"} fa-star"></i></button>
          <button class="act em ${c.em ? "on" : ""}" data-a="em" title="Emergency"><i class="fa-solid fa-heart-pulse"></i></button>
          <span class="ms-auto d-flex gap-2">
            <button class="act" data-a="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="act del" data-a="del" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </span>
        </div>
      </div>
    </div>`,
        )
        .join("")
    : `<div class="empty"><div class="box"><i class="fa-solid fa-address-book"></i></div>
        <h3>No contacts found</h3><p>${q ? "Try a different search term" : 'Click "Add Contact" to get started'}</p></div>`;

  const mini = (arr, msg) =>
    arr.length
      ? arr
          .map(
            (c) => `
    <div class="mini">${avatar(c, "sm")}
      <div class="flex-grow-1"><div class="nm">${esc(c.name)}</div><small>${esc(c.phone)}</small></div>
      <a class="act call" href="tel:${esc(c.phone)}" title="Call"><i class="fa-solid fa-phone"></i></a>
    </div>`,
          )
          .join("")
      : `<div class="side-empty">${msg}</div>`;
  $("favList").innerHTML = mini(
    contacts.filter((c) => c.fav),
    "No favorites yet",
  );
  $("emList").innerHTML = mini(
    contacts.filter((c) => c.em),
    "No emergency contacts",
  );
}

function setPreview() {
  $("photoPreview").innerHTML = photo
    ? `<img src="${photo}" alt="">`
    : '<i class="fa-solid fa-user"></i>';
}

function openModal(c) {
  editId = c ? c.id : null;
  photo = c?.photo || "";
  $("modalTitle").textContent = c ? "Edit Contact" : "Add New Contact";
  $("contactForm").reset();
  ["name", "phone", "email"].forEach((i) =>
    $(i).classList.remove("is-invalid"),
  );
  if (c) {
    $("name").value = c.name;
    $("phone").value = c.phone;
    $("email").value = c.email || "";
    $("address").value = c.address || "";
    $("group").value = c.group || "";
    $("notes").value = c.notes || "";
    $("isFav").checked = !!c.fav;
    $("isEm").checked = !!c.em;
  }
  setPreview();
  modal.show();
}

const val = {
  name: () => RX.name.test($("name").value.trim()),
  phone: () => RX.phone.test($("phone").value.trim().replace(/[\s-]/g, "")),
  email: () =>
    !$("email").value.trim() || RX.email.test($("email").value.trim()),
};
function checkField(id) {
  let ok = val[id]();
  if (id === "phone") {
    const ph = $("phone").value.trim().replace(/[\s-]/g, "");
    const dup = ok && contacts.some((c) => c.phone === ph && c.id !== editId);
    $("phoneFeedback").textContent = dup
      ? "This phone number already exists"
      : "Please enter a valid Egyptian phone number";
    ok = ok && !dup;
  }
  $(id).classList.toggle("is-invalid", !ok);
  return ok;
}
function validate() {
  return ["name", "phone", "email"].map(checkField).every(Boolean);
}
["name", "phone", "email"].forEach((id) =>
  $(id).addEventListener("input", () => checkField(id)),
);

$("addBtn").onclick = () => openModal(null);
$("searchInput").oninput = render;

$("photoInput").onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = 128,
        cv = document.createElement("canvas");
      cv.width = cv.height = s;
      const m = Math.min(img.width, img.height);
      cv.getContext("2d").drawImage(
        img,
        (img.width - m) / 2,
        (img.height - m) / 2,
        m,
        m,
        0,
        0,
        s,
        s,
      );
      photo = cv.toDataURL("image/jpeg", 0.8);
      setPreview();
    };
    img.src = r.result;
  };
  r.readAsDataURL(f);
};

$("contactForm").onsubmit = (e) => {
  e.preventDefault();
  if (!validate()) return;
  const data = {
    name: $("name").value.trim().replace(/\s+/g, " "),
    phone: $("phone").value.trim().replace(/[\s-]/g, ""),
    email: $("email").value.trim(),
    address: $("address").value.trim(),
    group: $("group").value,
    notes: $("notes").value.trim(),
    fav: $("isFav").checked,
    em: $("isEm").checked,
    photo,
  };
  if (editId) {
    contacts = contacts.map((c) => (c.id === editId ? { ...c, ...data } : c));
    toast.fire({ icon: "success", title: "Contact updated successfully" });
  } else {
    contacts.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...data,
    });
    toast.fire({ icon: "success", title: "Contact added successfully" });
  }
  save();
  modal.hide();
  render();
};

$("contactsList").onclick = (e) => {
  const btn = e.target.closest("[data-a]");
  if (!btn) return;
  const id = btn.closest("[data-id]").dataset.id;
  const c = contacts.find((x) => x.id === id);
  if (!c) return;
  const a = btn.dataset.a;
  if (a === "edit") return openModal(c);
  if (a === "fav" || a === "em") {
    c[a] = !c[a];
    save();
    render();
    return toast.fire({
      icon: "info",
      title:
        a === "fav"
          ? c.fav
            ? "Added to favorites"
            : "Removed from favorites"
          : c.em
            ? "Added to emergency"
            : "Removed from emergency",
    });
  }
  if (a === "del") {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete “${c.name}”?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete it",
    }).then((r) => {
      if (!r.isConfirmed) return;
      contacts = contacts.filter((x) => x.id !== id);
      save();
      render();
      Swal.fire({
        title: "Deleted!",
        text: "The contact has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  }
};

render();
