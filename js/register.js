document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const pass = document.getElementById("pass");
    const confirmPass = document.getElementById("confirmPass");
    const errorMessages = document.querySelectorAll(".error-message");
    const registerButton = document.querySelector("button");

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

    function validateEmail(email) {
        return email.length >= 8 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    registerButton.addEventListener("click", function (e) {
        e.preventDefault();
        clearErrors();
        let valid = true;

        if (username.value.trim() === "" || username.value.trim() > 30 ) {
            showError(username, "Mời nhập họ tên");
            valid = false;
        }

        if (username.value.trim().length > 25 ) {
            showError(username, "Độ dài tối đa 25 kí tự");
            valid = false;
        }

        if (email.value.trim() === "") {
            showError(email, "Mời nhập email");
            valid = false;
        } else if (!validateEmail(email.value)) {
            showError(email, "Email không hợp lệ");
            valid = false;
        }

        if (pass.value.trim() === "") {
            showError(pass, "Mời nhập mật khẩu");
            valid = false;
        } else if (pass.value.trim().length <= 8) {
            showError(pass, "Mật khẩu ít nhất 8 kí tự");
            valid = false;
        }

        if (confirmPass.value.trim() === "") {
            showError(confirmPass, "Mời nhập mật khẩu xác nhận");
            valid = false;
        } else if (confirmPass.value !== pass.value) {
            showError(confirmPass, "Mật khẩu xác nhận không trùng khớp");
            valid = false;
        }

        if (valid) {
            let users = JSON.parse(localStorage.getItem("user")) || [];
            const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;

            const userData = {
                id: newId,
                fullName: username.value.trim(), // Thay username thành fullName
                email: email.value.trim(),
                password: pass.value.trim()
            };

            const isDuplicate = users.some(user => user.email === userData.email);
            if (isDuplicate) {
                showError(email, "Email đã được đăng ký");
                return;
            }

            users.push(userData);
            localStorage.setItem("user", JSON.stringify(users)); // Lưu vào key "user"

            username.value = "";
            email.value = "";
            pass.value = "";
            confirmPass.value = "";

            window.location.href = "login.html";
        }
    });
});