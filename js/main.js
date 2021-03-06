const body = document.body;
const themeToggler = document.querySelectorAll(".header__toggle-btn");
const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
const inputField = document.querySelector(".header__input");
const toDoContainer = document.querySelector(".toDo");
const optionsTab = document.querySelector(".options");
const categories = document.querySelectorAll(".options__category");
const remainingTasks = document.querySelector(".options__remaining");
let LOCAL_STORAGE_LIST = [];
let activeTasksCount = 0;

//for mobile touch events
let xPos;
let yPos;
let touchedElement;
let delay = 800;
let time;
let dragging;

//detect the device's color mode
if (isDarkMode) {
    toggleTheme();
}

themeToggler.forEach(btn => {
    btn.addEventListener("click", toggleTheme);
});

inputField.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();

        const fieldValue = inputField.value;
        const savedLists = LOCAL_STORAGE_LIST.map(list => list.toDo);

        if (fieldValue && !savedLists.includes(fieldValue)) {
            addToDo(fieldValue, false);
            inputField.value = "";
            inputField.focus();
        } else console.log("already exist");
    }
});

toDoContainer.addEventListener("click", e => handleClickEvent(e.target));

optionsTab.addEventListener("click", e => {
    const target = e.target;

    if (target.matches(".options__category")) {
        filterList(target);
    } else if (target.matches(".options__clear")) {
        clearCompleted();
    }
});

const optionsVisibility = () => {
    //if the list is empty, hide the options
    if (toDoContainer.offsetHeight === 0 && toDoContainer.childElementCount === 0) {
        optionsTab.style.display = "none";
    } else if (toDoContainer.offsetHeight > 0) {
        optionsTab.style.display = "flex";
    }
}

const disableScrolling = () => {
    body.style.height = "100vh";
    body.style.overflowY = "hidden";
}

const enableScrolling = () => {
    body.style.height = "";
    body.style.overflowY = "";
}

checkStorage();
optionsVisibility();

function toggleTheme() {
    if (body.classList.contains("dark-theme")) {
        body.classList.remove("dark-theme");
    } else {
        body.classList.add("dark-theme");
    }
}

function addToDo(task, status) {
    const toDoItem = `
    <li class="toDo__list" data-complete="${status}" draggable="true">
        <span class="checkbox ${ status === true ? 'checkbox--checked' : '' }"></span>
        <p class="toDo__text ${ status === true ? 'toDo__text--checked' : '' }">${task}</p>

        <img class="toDo__remove" src="images/icon-cross.svg" alt="remove">
    </li>     
    `

    toDoContainer.insertAdjacentHTML("beforeend", toDoItem);

    saveToStorage(task, status);

    taskCounter();
    optionsVisibility();
}

function removeToDo(task) {
    const taskParent = task.parentElement;
    const indexToRemove = Array.from(toDoContainer.children).indexOf(taskParent);

    removeFromStorage(indexToRemove);
    toDoContainer.removeChild(taskParent);

    taskCounter();
    optionsVisibility();
}

function updateTaskStatus(task) {
    const elementTag = task.tagName.toLowerCase();

    if (elementTag === "span") {
        toggleCheckbox(task);

    } else if (elementTag === "li") {
        const firstElement = task.firstElementChild;

        toggleCheckbox(firstElement);
    } else if (elementTag === "p") {
        const previousSibling = task.previousElementSibling;

        toggleCheckbox(previousSibling);
    }

    function toggleCheckbox(checkbox){
        const listText = checkbox.nextElementSibling;

        if (!checkbox.classList.contains("checkbox--checked")) {
            checkbox.classList.add("checkbox--checked");
            listText.classList.add("toDo__text--checked");
            tagAsComplete(task);
            taskCounter();

            updateStorage(listText);
        } else {
            checkbox.classList.remove("checkbox--checked");
            listText.classList.remove("toDo__text--checked");
            tagAsIncomplete(task);
            taskCounter();

            updateStorage(listText);
        }
    }
}

function tagAsComplete(listElement) {
    const listContainer = listElement.closest(".toDo__list");

    listContainer.setAttribute("data-complete", "true");
}

function tagAsIncomplete(list) {
    const listContainer = list.closest(".toDo__list");
    
    listContainer.setAttribute("data-complete", "false");  
}

function filterList(selectedCategory) {
    const categoryText = selectedCategory.textContent;
    const toDoLists = document.querySelectorAll(".toDo__list");
    const activeSelectedCategory = () => {
        categories.forEach(category => {
            category.classList.remove("options__category--active");
            selectedCategory.classList.add("options__category--active");
        })
    };

    if (categoryText === "Completed") {
        activeSelectedCategory();

        toDoLists.forEach(list => {
            list.style.display = "flex"
        
            if (list.dataset.complete === "false") {
                list.style.display = "none"
            }
        });
    } else if (categoryText === "Active") {
        activeSelectedCategory();
        
        toDoLists.forEach(list => {
            list.style.display = "flex"
        
            if (list.dataset.complete === "true") {
                list.style.display = "none"
            }
        });
    } else {
        activeSelectedCategory();

        toDoLists.forEach(list => list.style.display = "flex");
    }
}

function clearCompleted() {
    const toDoLists = document.querySelectorAll(".toDo__list");

    toDoLists.forEach(list => {
        if (list.dataset.complete === "true") {
            toDoContainer.removeChild(list);
            removeCompletedFromStorage();
        }
    })

    optionsVisibility();
}

function saveToStorage(list, status) {
    const taskList = {
        toDo: list,
        completed: status
    }

    LOCAL_STORAGE_LIST.push(taskList);

    localStorage.setItem("toDo", JSON.stringify(LOCAL_STORAGE_LIST));
}

function updateStorage(list) {
    const listText = list.textContent;
    const listIndex = LOCAL_STORAGE_LIST.findIndex(list => list.toDo === listText);

    if (LOCAL_STORAGE_LIST[listIndex].completed === false) {
        LOCAL_STORAGE_LIST[listIndex].completed = true;
    } else {
        LOCAL_STORAGE_LIST[listIndex].completed = false;
    }

    localStorage.setItem("toDo", JSON.stringify(LOCAL_STORAGE_LIST))
}

function removeFromStorage(index) {
    LOCAL_STORAGE_LIST.splice(index, 1)

    localStorage.setItem("toDo", JSON.stringify(LOCAL_STORAGE_LIST));
}

function removeCompletedFromStorage() {
    const incompleteTasks = LOCAL_STORAGE_LIST.filter(list => list.completed === false);

    LOCAL_STORAGE_LIST.forEach(list => {
        if (list.completed === true) {
            const listIndex = LOCAL_STORAGE_LIST.indexOf(list);

            LOCAL_STORAGE_LIST.splice(listIndex, 1)
        }
    })

    localStorage.setItem("toDo", JSON.stringify(incompleteTasks));
}

function checkStorage() {
    if (localStorage.getItem("toDo")) {
        const savedList = JSON.parse(localStorage.getItem("toDo"))

        savedList.forEach(list => {
            addToDo(list.toDo, list.completed)
        })
    }
}

function taskCounter() {
    const incompleteTasks = [...document.querySelectorAll(".toDo__list")].filter(list => list.dataset.complete === "false");

    remainingTasks.textContent = `${incompleteTasks.length} items left`;
}

function handleClickEvent(elem) {
    if (elem.matches(".toDo__list") || elem.matches(".toDo__text") || elem.matches(".checkbox")) {
        updateTaskStatus(elem);
    } else if (elem.matches(".toDo__remove")) {
        removeToDo(elem);
    }
}

function handleDragEvent(elem) {
    let target = elem;

    target.classList.add("toDo__list--dragging");

    const inactive = toDoContainer.querySelectorAll(".toDo__list:not(.toDo__list--dragging)");

    inactive.forEach(list => list.classList.add("toDo__list--inactive"));
}

function handleDragEndEvent() {
    const allList = toDoContainer.querySelectorAll(".toDo__list");
    
    allList.forEach(list => {
        list.classList.remove("toDo__list--dragging");
        list.classList.remove("toDo__list--inactive");
        list.classList.remove("toDo__list--dropzone");
    })
}

//drag & drop event listeners
toDoContainer.addEventListener("dragstart", e => handleDragEvent(e.target));

toDoContainer.addEventListener("dragend", e => handleDragEndEvent());

toDoContainer.addEventListener("dragenter", e => {
    const target = e.target; 

    if (target.tagName.toLowerCase() === "li") {
        target.classList.add("toDo__list--dropzone");
    }
})

toDoContainer.addEventListener("dragleave", e => {
    const target = e.target; 

    target.classList.remove("toDo__list--dropzone");
})

toDoContainer.addEventListener("dragover", e => {
    e.preventDefault();
})

toDoContainer.addEventListener("drop", e => {
    let target = e.target;
    let listContainer;
    const selectedList = document.querySelector(".toDo__list--dragging");

    if (target.tagName.toLowerCase() === "li") {
        listContainer = target.parentElement;

        listContainer.insertBefore(selectedList, target);
    } else if (target.tagName.toLowerCase() === "p" || target.tagName.toLowerCase() === "span") {
        listContainer = target.closest(".toDo")
        target = target.closest(".toDo__list");
        
        listContainer.insertBefore(selectedList, target);
    }
})

toDoContainer.addEventListener("touchstart", e => {
    e.preventDefault();
    const target = e.target;
    dragging = false;

    handleClickEvent(target);

    if (target.tagName.toLowerCase() === "li") {
        touchedElement = target;
    } else if (target.tagName.toLowerCase() === "p" || target.tagName.toLowerCase() === "span") {
        touchedElement = target.closest(".toDo__list")
    }

    time = setTimeout(longPress.bind(touchedElement), delay);

    touchedElement.addEventListener("touchend", () => {
        clearTimeout(time);
    });
})

function longPress() {
    touchedElement = this;

    handleDragEvent(touchedElement)

    toDoContainer.addEventListener("touchmove", e => {
        dragging = true;
        xPos = e.touches[0].clientX;
        yPos = e.touches[0].clientY;
    
        const allList = toDoContainer.querySelectorAll(".toDo__list");
        const hoveredOver = document.elementFromPoint(xPos, yPos);
    
        allList.forEach(list => {
            list.classList.remove("toDo__list--dropzone");
        })

        if (hoveredOver.tagName.toLowerCase() === "li") {
            hoveredOver.classList.add("toDo__list--dropzone");
        }
    
        disableScrolling();
    })

    toDoContainer.addEventListener("touchend", e => {
        if (dragging === true) {
            handleDragEndEvent();
            enableScrolling();
            getHoveredElement(xPos, yPos);
        }
    });
}

function getHoveredElement(x, y) {
    const hoveredElement = document.elementFromPoint(x, y)

    if (hoveredElement.tagName.toLowerCase() === "li") {
        toDoContainer.insertBefore(touchedElement, hoveredElement);
    }
}