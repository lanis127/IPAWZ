console.log("JavaScript carregado!");

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");

if (openMenu) {
    openMenu.addEventListener("click", () => {

        if (sidebar) sidebar.classList.add("active");
        if (overlay) overlay.classList.add("active");

    });
}

if (closeMenu) {
    closeMenu.addEventListener("click", closeSidebar);
}

if (overlay) {
    overlay.addEventListener("click", closeSidebar);
}

function closeSidebar() {

    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");

}

const backTop = document.querySelector(".back-top");

if (backTop) {
    backTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}