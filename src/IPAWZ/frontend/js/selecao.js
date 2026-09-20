document.addEventListener("DOMContentLoaded", () => {

    const radios = document.querySelectorAll(
        'input[name="tipo_pessoa"]'
    );

    radios.forEach(radio => {

        radio.addEventListener("change", () => {

            if (radio.value === "pf") {
                window.location.href = "cadastro-pf.html";
            }

            if (radio.value === "pj") {
                window.location.href = "cadastro-pj.html";
            }

        });

    });

});