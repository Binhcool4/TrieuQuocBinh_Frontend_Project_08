document.addEventListener("DOMContentLoaded", function () {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("pass");
    const loginButton = document.querySelector("button");
    const errorMessages = document.querySelectorAll(".error-message");

    function showError(input, message) {
        const parent = input.parentElement;
        const errorMsg = parent.querySelector(".error-message");
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
        input.classList.add("error");
    }

    function clearErrors() {
        errorMessages.forEach(msg => msg.style.display = "none");
        document.querySelectorAll(".error").forEach(input => input.classList.remove("error"));
    }

    loginButton.addEventListener("click", function (e) {
        e.preventDefault();
        clearErrors();

        const users = JSON.parse(localStorage.getItem("user")) || []; // Đổi key thành "user"
        let valid = true;

        if (users.length === 0) {
            showError(emailInput, "Không có tài khoản nào được đăng ký");
            valid = false;
        } else {
            const matchedUser = users.find(user =>
                user.email === emailInput.value.trim() &&
                user.password === passwordInput.value.trim()
            );

            if (!matchedUser) {
                showError(passwordInput, "Email hoặc mật khẩu không chính xác");
                valid = false;
            } else {
                localStorage.setItem("currentUser", matchedUser.id); // Chỉ lưu ID
            }
        }

        if (valid) {
            emailInput.value = "";
            passwordInput.value = "";
            window.location.href = "project-manager.html";
        }
    });
});