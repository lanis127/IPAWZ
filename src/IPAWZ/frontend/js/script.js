console.log("JavaScript carregado!");   

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");

if(openMenu){

    openMenu.addEventListener("click", () => {

        sidebar.classList.add("active");
        overlay.classList.add("active");

    });

}

closeMenu.addEventListener("click", closeSidebar);

overlay.addEventListener("click", closeSidebar);

function closeSidebar(){

    sidebar.classList.remove("active");
    overlay.classList.remove("active");

}

const backTop = document.querySelector(".back-top");

backTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});
