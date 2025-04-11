let currentUser = localStorage.getItem("currentUser");
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const itemsPerPage = 4;
let currentPage = 1;
let filteredProjects = [];

function getUserProjects() {
    if (!currentUser) return [];
    return projects.filter(project => 
        project.members.some(member => 
            member.userId === parseInt(currentUser) && member.role === "Project owner"
        )
    );
}

function displayProjects(projectList, page) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    if (projectList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3"><i class="fa-solid fa-box-open"></i><span class="t">Chưa có dự án nào để hiển thị</span> </td></tr>';
        updatePagination(0);
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProjects = projectList.slice(start, end);

    const fragment = document.createDocumentFragment();
    paginatedProjects.forEach(project => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${project.id}</td>
            <td>${project.projectName}</td>
            <td>
                <button class="edit" onclick="editProject(${project.id})">Sửa</button>
                <button class="delete" onclick="deleteProject(${project.id})">Xóa</button>
                <button class="details"><a href="../pages/project-details.html?projectId=${project.id}">Chi tiết</a></button>
            </td>
        `;
        fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);

    updatePagination(projectList.length);
    document.querySelector('.add-project').disabled = !currentUser;
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    if (totalItems === 0) return;

    const prev = document.createElement('span');
    prev.className = 'prev';
    prev.innerHTML = '<';
    if (currentPage === 1) prev.classList.add('disabled');
    else prev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayProjects(filteredProjects, currentPage);
        }
    });
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const page = document.createElement('span');
        page.textContent = i;
        if (i === currentPage) page.className = 'active';
        page.addEventListener('click', () => {
            currentPage = i;
            displayProjects(filteredProjects, currentPage);
        });
        pagination.appendChild(page);
    }

    const next = document.createElement('span');
    next.className = 'next';
    next.innerHTML = '>';
    if (currentPage === totalPages || totalPages === 0) next.classList.add('disabled');
    else next.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayProjects(filteredProjects, currentPage);
        }
    });
    pagination.appendChild(next);
}

const addProjectBtn = document.querySelector('.add-project');
const modal = document.querySelector('.bg-modal');
const closeModal = modal.querySelector('.fa-x');
const form = modal.querySelector('.modalForm');
const saveBtn = modal.querySelector('.save');
const cancelBtn = modal.querySelector('.cancel');
let isEditing = false;
let editingId = null;

addProjectBtn.addEventListener('click', () => {
    isEditing = false;
    editingId = null;
    modal.style.display = 'block';
    form.reset();
    modal.querySelector('p').textContent = 'Thêm dự án';
    document.querySelectorAll('.modalForm .error-message').forEach(msg => msg.style.display = 'none');
});

closeModal.addEventListener('click', () => modal.style.display = 'none');
cancelBtn.addEventListener('click', () => modal.style.display = 'none');

saveBtn.addEventListener('click', () => {
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const nameError = document.querySelector('.modalForm .error-message:nth-of-type(1)');
    const descError = document.querySelector('.modalForm .error-message:nth-of-type(2)');

    nameError.style.display = 'none';
    descError.style.display = 'none';

    let valid = true;

    if (!projectName) {
        nameError.textContent = 'Vui lòng nhập tên dự án';
        nameError.style.display = 'block';
        valid = false;
    } else if (projectName.length < 3 || projectName.length > 50) {
        nameError.textContent = `Tên dự án phải từ 3 đến 50 ký tự`;
        nameError.style.display = 'block';
        valid = false;
    }

    if (!projectDescription) {
        descError.textContent = 'Vui lòng nhập mô tả dự án';
        descError.style.display = 'block';
        valid = false;
    } else if (projectDescription.length < 10 || projectDescription.length > 200) {
        descError.textContent = `Mô tả dự án phải từ 10 đến 200 ký tự`;
        descError.style.display = 'block';
        valid = false;
    }

    const isDuplicate = projects.some(project => 
        project.projectName.toLowerCase() === projectName.toLowerCase() && 
        (!isEditing || project.id !== editingId)
    );
    if (isDuplicate) {
        nameError.textContent = 'Tên dự án đã tồn tại';
        nameError.style.display = 'block';
        valid = false;
    }

    if (!valid) return;

    let newProject;
    if (isEditing) {
        const projectIndex = projects.findIndex(p => p.id === editingId);
        newProject = { 
            id: editingId, 
            projectName,
            projectInfo: projectDescription,
            members: projects[projectIndex].members
        };
        projects[projectIndex] = newProject;
    } else {
        const newId = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
        newProject = { 
            id: newId, 
            projectName,
            projectInfo: projectDescription,
            members: currentUser ? [{ userId: parseInt(currentUser), role: "Project owner" }] : []
        };
        projects.push(newProject);
    }

    localStorage.setItem('projects', JSON.stringify(projects));
    filteredProjects = getUserProjects();
    displayProjects(filteredProjects, currentPage);
    modal.style.display = 'none';
});

function editProject(id) {
    isEditing = true;
    editingId = id;
    const project = projects.find(p => p.id === id);
    modal.style.display = 'block';
    modal.querySelector('p').textContent = 'Sửa dự án';
    document.getElementById('projectName').value = project.projectName;
    document.getElementById('projectDescription').value = project.projectInfo || "";
    document.querySelectorAll('.modalForm .error-message').forEach(msg => msg.style.display = 'none');
}

const confirmModal = document.querySelectorAll('.bg-modal')[1];
const confirmDeleteBtn = confirmModal.querySelector('button[style*="dc3545"]');
const cancelDeleteBtn = confirmModal.querySelector('.cancel');
const closeConfirmModal = confirmModal.querySelector('.fa-x');
let deleteId = null;

function deleteProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) {
        console.error("Dự án không tồn tại!");
        return;
    }
    deleteId = id;
    confirmModal.style.display = 'block';
}

closeConfirmModal.addEventListener('click', () => confirmModal.style.display = 'none');
cancelDeleteBtn.addEventListener('click', () => confirmModal.style.display = 'none');

confirmDeleteBtn.addEventListener('click', () => {
    tasks = tasks.filter(task => task.projectId !== deleteId);
    projects = projects.filter(p => p.id !== deleteId);
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    filteredProjects = getUserProjects();
    currentPage = Math.min(currentPage, Math.ceil(filteredProjects.length / itemsPerPage)) || 1;
    displayProjects(filteredProjects, currentPage);
    confirmModal.style.display = 'none';
});

const searchBox = document.querySelector('.search-box');
searchBox.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filteredProjects = getUserProjects().filter(project => 
        project.projectName.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayProjects(filteredProjects, currentPage);
});

document.addEventListener('DOMContentLoaded', () => {
    filteredProjects = getUserProjects();
    displayProjects(filteredProjects, currentPage);
});

document.querySelector('a[href="../pages/login.html"]').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = "../pages/login.html";
});