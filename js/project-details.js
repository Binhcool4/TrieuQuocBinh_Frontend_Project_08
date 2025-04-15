document.addEventListener("DOMContentLoaded", () => {
    // Khởi tạo dữ liệu
    let projects = [];
    let users = [];
    let allTasks = [];

    // Kiểm tra và lấy dữ liệu từ localStorage
    const projectsData = localStorage.getItem("projects");
    if (projectsData && projectsData !== "null" && projectsData !== "undefined") {
        projects = JSON.parse(projectsData) || [];
    }

    const usersData = localStorage.getItem("user");
    if (usersData && usersData !== "null" && usersData !== "undefined") {
        users = JSON.parse(usersData) || [];
    }

    const tasksData = localStorage.getItem("tasks");
    if (tasksData && tasksData !== "null" && tasksData !== "undefined") {
        allTasks = JSON.parse(tasksData) || [];
    }

    // Lấy projectId từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get("projectId")) || 1;

    // Lọc task hợp lệ
    allTasks = allTasks.filter((task) => task.assigneeId !== null && !isNaN(task.assigneeId) && task.projectId !== undefined);

    // Tìm dự án
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
        alert("Không tìm thấy dự án!");
        return;
    }

    // Hiển thị thông tin dự án
    const projectInfo = document.querySelector(".project-info");
    if (projectInfo) {
        projectInfo.querySelector("h2").textContent = project.projectName;
        projectInfo.querySelector("p").textContent = project.projectInfo;
    }

    // Hiển thị thành viên (bao gồm chủ tài khoản)
    const listMember = document.querySelector(".list-member");
    if (listMember) {
        listMember.innerHTML = "";
        if (!project.members || project.members.length === 0) {
            listMember.innerHTML = "<p>Không có thành viên trong dự án.</p>";
        } else {
            project.members.forEach((member) => {
                const user = users.find((u) => u.id == member.userId);
                if (user) {
                    const initials = user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase();
                    listMember.innerHTML += `
                        <div class="member">
                            <div class="avatar ${initials.toLowerCase()}">${initials}</div>
                            <div class="info">
                                <span>${user.fullName}</span>
                                <small>${member.role}${member.role === "Project owner" ? "" : ""}</small>
                            </div>
                        </div>`;
                }
            });
            listMember.innerHTML += `<span class="more"><i class="fa-solid fa-ellipsis"></i></span>`;
        }
    }

    // Điền danh sách người phụ trách
    const personInChargeSelect = document.getElementById("person-in-charge");
    if (personInChargeSelect) {
        personInChargeSelect.innerHTML = '<option value="">Chọn người phụ trách</option>';
        if (project.members && project.members.length > 0) {
            project.members.forEach((member) => {
                const user = users.find((u) => u.id == member.userId);
                if (user) {
                    personInChargeSelect.innerHTML += `<option value="${user.id}">${user.fullName}</option>`;
                }
            });
        }
    }

    // Kiểm tra thành viên hợp lệ
    if (!project.members || project.members.length === 0) {
        const errorMessage = document.createElement("p");
        errorMessage.className = "error-message";
        errorMessage.textContent = "Dự án không có thành viên để phân công!";
        if (projectInfo) projectInfo.appendChild(errorMessage);
        const addTaskBtn = document.querySelector(".btn");
        if (addTaskBtn) addTaskBtn.disabled = true;
    }

    // Modal elements
    const taskModal = document.querySelector(".addModal")?.parentElement;
    const confirmModal = document.querySelector(".confirmModal")?.parentElement;
    const addMemModal = document.querySelector(".addMemModal")?.parentElement;
    const addMemBtn = document.querySelector(".addMemBtn");

    if (!taskModal || !confirmModal) {
        console.error("Không tìm thấy modal!");
        const addTaskBtn = document.querySelector(".btn");
        if (addTaskBtn) addTaskBtn.disabled = true;
        return;
    }

    const modalTitle = taskModal.querySelector("p");
    const saveBtn = taskModal.querySelector(".save");
    const cancelBtns = document.querySelectorAll(".cancel, .fa-x");
    const confirmDeleteBtn = confirmModal.querySelector(".confirmDelete");

    let editingRow = null;
    let deletingRow = null;

    // Hàm tiện ích
    function openModal(modal) {
        if (modal) {
            modal.style.display = "flex";
            clearAllErrors();
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.style.display = "none";
            editingRow = null;
            deletingRow = null;
            document.getElementById("assignDate").removeAttribute("min");
            document.getElementById("dueDate").removeAttribute("min");
            document.getElementById("assignDate").onchange = null;
            clearAllErrors();
        }
    }

    function formatDisplayDate(dateStr) {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${month}-${day}`;
    }

    function getPriorityText(p) {
        return p === "high" ? "Cao" : p === "medium" ? "Trung bình" : "Thấp";
    }

    function getProgressText(p) {
        return p === "on-track" ? "Đúng tiến độ" : p === "risky" ? "Có rủi ro" : "overdue" ? "Trễ hạn" : "";
    }

    function getTbodyByStatus(status) {
        return document.querySelector(`#${status.toLowerCase().replace(" ", "")}-list`);
    }

    function getUserFullName(userId) {
        const user = users.find((u) => u.id == userId);
        return user ? user.fullName : "Không rõ";
    }

    function renderTaskRow(task) {
        return `
        <tr data-id="${task.id}">
            <td>${task.name}</td>
            <td>${getUserFullName(parseInt(task.assigneeId))}</td>
            <td><span class="priority ${task.priority}">${getPriorityText(task.priority)}</span></td>
            <td class="start-date">${formatDisplayDate(task.start)}</td>
            <td class="deadline">${formatDisplayDate(task.end)}</td>
            <td><span class="status ${task.progress}">${getProgressText(task.progress)}</span></td>
            <td>
                <button class="edit">Sửa</button>
                <button class="delete">Xóa</button>
            </td>
        </tr>`;
    }

    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        const errorP = document.getElementById(`${inputId}-error`);
        if (input && errorP) {
            input.classList.add("error");
            errorP.textContent = message;
            errorP.style.display = "block";
        }
    }

    function clearError(inputId) {
        const input = document.getElementById(inputId);
        const errorP = document.getElementById(`${inputId}-error`);
        if (input && errorP) {
            input.classList.remove("error");
            errorP.textContent = "";
            errorP.style.display = "none";
        }
    }

    function clearAllErrors() {
        ["taskName", "person-in-charge", "priority", "assignDate", "dueDate", "progress", "status"].forEach((id) =>
            clearError(id)
        );
    }

    function clearForm() {
        document.querySelector(".modalForm")?.reset();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        document.getElementById("assignDate").setAttribute("min", todayStr);
        document.getElementById("dueDate").setAttribute("min", todayStr);
        document.getElementById("assignDate").onchange = null;
        clearAllErrors();
    }

    function saveTasksToLocalStorage() {
        localStorage.setItem("tasks", JSON.stringify(allTasks));
    }

    function openEditModal(row) {
        editingRow = row;
        modalTitle.textContent = "Sửa nhiệm vụ";
        saveBtn.textContent = "Lưu";

        const taskId = parseInt(row.dataset.id);
        const task = allTasks.find((t) => t.id === taskId);

        if (!task) {
            alert("Không tìm thấy nhiệm vụ!");
            return;
        }

        document.getElementById("taskName").value = task.name || "";
        document.getElementById("person-in-charge").value = task.assigneeId || "";
        document.getElementById("priority").value = task.priority || "";
        document.getElementById("assignDate").value = task.start || "";
        document.getElementById("dueDate").value = task.end || "";
        document.getElementById("progress").value = task.progress || "";
        document.getElementById("status").value = task.status || "";

        document.getElementById("assignDate").onchange = function () {
            const newStartDate = this.value;
            document.getElementById("dueDate").setAttribute("min", newStartDate);
            if (new Date(document.getElementById("dueDate").value) < new Date(newStartDate)) {
                document.getElementById("dueDate").value = newStartDate;
            }
        };

        openModal(taskModal);
    }

    function openDeleteModal(row) {
        deletingRow = row;
        openModal(confirmModal);
    }

    function bindEvents() {
        document.querySelectorAll("tbody .edit").forEach((btn) => {
            btn.onclick = () => {
                const row = btn.closest("tr");
                if (row) openEditModal(row);
            };
        });
        document.querySelectorAll("tbody .delete").forEach((btn) => {
            btn.onclick = () => {
                const row = btn.closest("tr");
                if (row) openDeleteModal(row);
            };
        });
    }

    function loadTasks() {
        const statusLists = {
            "To do": document.querySelector("#todo-list"),
            "In progress": document.querySelector("#inprogress-list"),
            "Pending": document.querySelector("#pending-list"),
            "Done": document.querySelector("#done-list"),
        };

        Object.values(statusLists).forEach((tbody) => {
            if (tbody) tbody.innerHTML = "";
        });

        allTasks
            .filter((t) => t.projectId === projectId)
            .forEach((task) => {
                const statusTbody = getTbodyByStatus(task.status);
                if (statusTbody) {
                    statusTbody.insertAdjacentHTML("beforeend", renderTaskRow(task));
                }
            });

        bindEvents();
    }

    // Gắn sự kiện
    const addTaskBtn = document.querySelector(".btn");
    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
            openModal(taskModal);
            modalTitle.textContent = "Thêm nhiệm vụ";
            saveBtn.textContent = "Lưu";
            clearForm();
            editingRow = null;
        });
    }

    if (addMemBtn && addMemModal) {
        addMemBtn.addEventListener("click", () => openModal(addMemModal));
    }

    cancelBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const modal = btn.closest(".bg-modal");
            closeModal(modal);
        });
    });

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            clearAllErrors();

            const name = document.getElementById("taskName").value.trim();
            const assigneeId = parseInt(document.getElementById("person-in-charge").value);
            const priority = document.getElementById("priority").value;
            const start = document.getElementById("assignDate").value;
            const end = document.getElementById("dueDate").value;
            const progress = document.getElementById("progress").value;
            const status = document.getElementById("status").value;

            let hasError = false;

            if (!name) {
                showError("taskName", "Vui lòng nhập tên nhiệm vụ.");
                hasError = true;
            }
            if (isNaN(assigneeId)) {
                showError("person-in-charge", "Vui lòng chọn người phụ trách.");
                hasError = true;
            }
            if (!priority) {
                showError("priority", "Vui lòng chọn độ ưu tiên.");
                hasError = true;
            }
            if (!start) {
                showError("assignDate", "Vui lòng chọn ngày bắt đầu.");
                hasError = true;
            }
            if (!end) {
                showError("dueDate", "Vui lòng chọn ngày hạn.");
                hasError = true;
            }
            if (!progress) {
                showError("progress", "Vui lòng chọn tiến độ.");
                hasError = true;
            }
            if (!status) {
                showError("status", "Vui lòng chọn trạng thái.");
                hasError = true;
            }
            if (hasError) return;

            if (new Date(start) > new Date(end)) {
                showError("assignDate", "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hạn chót.");
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(start);
            const endDate = new Date(end);

            if (!editingRow) {
                if (startDate < today) {
                    showError("assignDate", "Ngày bắt đầu không được trước ngày hiện tại.");
                    return;
                }
                if (endDate < today) {
                    showError("dueDate", "Ngày hạn không được trước ngày hiện tại.");
                    return;
                }
            }

            const task = {
                id: editingRow
                    ? parseInt(editingRow.dataset.id)
                    : allTasks.length
                    ? Math.max(...allTasks.map((t) => t.id)) + 1
                    : 1,
                name,
                assigneeId,
                priority,
                start,
                end,
                progress,
                status,
                projectId,
            };

            if (editingRow) {
                const index = allTasks.findIndex((t) => t.id === task.id);
                if (index > -1) {
                    allTasks[index] = task;
                }
                editingRow.remove();
                const statusTbody = getTbodyByStatus(task.status);
                statusTbody.insertAdjacentHTML("beforeend", renderTaskRow(task));
            } else {
                allTasks.push(task);
                const statusTbody = getTbodyByStatus(task.status);
                statusTbody.insertAdjacentHTML("beforeend", renderTaskRow(task));
            }

            saveTasksToLocalStorage();
            bindEvents();
            closeModal(taskModal);
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", () => {
            const id = parseInt(deletingRow.dataset.id);
            allTasks = allTasks.filter((t) => t.id !== id);
            deletingRow.remove();
            saveTasksToLocalStorage();
            closeModal(confirmModal);
        });
    }

    loadTasks();
});