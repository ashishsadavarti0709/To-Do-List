/**
 * Project: Advanced To-Do List
 * Name: Ashish Sadavarti
 * Date: 2025
 * Copyright reserved
 * * Features: 
 * - Add, edit, delete tasks
 * - Mark tasks as complete
 * - Filter tasks (All, Today, Upcoming, Completed)
 * - Priority levels
 * - Categories
 * - Due dates
 * - Dark/light mode toggle
 * - Local storage persistence
 * - Responsive design
 * - Micro-interactions
 */

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    // Get references to all necessary HTML elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskCategorySelect = document.getElementById('task-category'); // Added category select
    const taskPrioritySelect = document.getElementById('task-priority'); // Added priority select
    const taskDueDateInput = document.getElementById('task-due-date'); // Added due date input
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');
    const pendingTasksElement = document.getElementById('pending-tasks');
    
    // --- State Variables ---
    // `tasks` array will hold all task objects
    let tasks = [];
    // `currentFilter` tracks which filter is active ('all', 'today', 'upcoming', 'completed')
    let currentFilter = 'all';
    
    // --- Initialization Function ---
    // This function sets up the application when the page loads
    function init() {
        loadTasks(); // Load tasks from local storage
        renderTaskList(); // Display tasks on the UI
        updateStats(); // Update task statistics
        setupEventListeners(); // Set up all interactive listeners
        checkThemePreference(); // Apply saved theme or system preference
    }
    
    // --- Event Listeners Setup ---
    // Centralized function to attach all event listeners
    function setupEventListeners() {
        // Listen for form submission to add a new task
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form refresh
            addTask(); // Call function to add the task
        });
        
        // Listen for clicks on filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove 'active' class from all filter buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add 'active' class to the clicked button
                this.classList.add('active');
                // Update the current filter based on the button's data-filter attribute
                currentFilter = this.dataset.filter;
                // Re-render the task list with the new filter
                renderTaskList();
            });
        });
        
        // Listen for clicks on the theme switcher button
        themeSwitcher.addEventListener('click', toggleTheme);
    }
    
    // --- Task Management Functions ---

    // Adds a new task to the `tasks` array
    function addTask() {
        const text = taskInput.value.trim();
        // Basic validation: do not add empty tasks
        if (!text) return; 
        
        // Get values from category, priority, and due date inputs
        const category = taskCategorySelect.value;
        const priority = taskPrioritySelect.value;
        const dueDate = taskDueDateInput.value; // Date format YYYY-MM-DD
        
        // Create a new task object
        const newTask = {
            id: Date.now(), // Unique ID based on timestamp
            text, // Task description
            completed: false, // Initial status is not completed
            category, // Task category
            priority, // Task priority
            dueDate: dueDate || null, // Due date (null if not set)
            createdAt: new Date().toISOString() // Timestamp of creation
        };
        
        tasks.push(newTask); // Add new task to the array
        saveTasks(); // Save tasks to local storage
        renderTaskList(); // Update the UI
        updateStats(); // Update statistics
        
        // Reset form inputs after adding task
        taskInput.value = '';
        taskCategorySelect.value = 'personal'; // Reset to default category
        taskPrioritySelect.value = 'low'; // Reset to default priority
        taskDueDateInput.value = ''; // Clear due date
        taskInput.focus(); // Focus back on the task input for quick entry
    }
    
    // Renders the task list based on the `currentFilter`
    function renderTaskList() {
        taskList.innerHTML = ''; // Clear existing tasks from the UI
        
        const filteredTasks = filterTasks(); // Get tasks that match the current filter
        
        // Display an empty message if no tasks match the filter
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = getEmptyMessage(); // Get context-specific message
            taskList.appendChild(emptyMessage);
            return;
        }
        
        // Create and append a task element for each filtered task
        filteredTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    }
    
    // Filters the `tasks` array based on the `currentFilter`
    function filterTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to midnight for accurate date comparison
        
        return tasks.filter(task => {
            switch (currentFilter) {
                case 'completed':
                    return task.completed; // Show only completed tasks
                case 'today':
                    // Show uncompleted tasks due today
                    if (task.completed) return false;
                    if (!task.dueDate) return false;
                    const dueDateToday = new Date(task.dueDate);
                    dueDateToday.setHours(0, 0, 0, 0);
                    return dueDateToday.getTime() === today.getTime();
                case 'upcoming':
                    // Show uncompleted tasks due in the future
                    if (task.completed) return false;
                    if (!task.dueDate) return false;
                    const dueDateUpcoming = new Date(task.dueDate);
                    dueDateUpcoming.setHours(0, 0, 0, 0);
                    return dueDateUpcoming.getTime() > today.getTime();
                case 'all':
                default:
                    // Show all uncompleted tasks (default view)
                    return !task.completed; 
            }
        });
    }
    
    // Creates an HTML `li` element for a given task object
    function createTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id; // Store task ID in a data attribute
        
        // Add 'completed' class if the task is completed for styling
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        // Checkbox for task completion
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        // Attach event listener to toggle task completion status
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
        
        // Span for task text
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        
        // Category badge
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'task-category';
        categoryBadge.textContent = task.category;
        
        // Priority indicator (colored circle)
        const priorityIndicator = document.createElement('span');
        priorityIndicator.className = `task-priority ${task.priority}`; // Class for specific color
        
        // Due date element
        const dueDateElement = document.createElement('span');
        dueDateElement.className = 'task-due-date';
        
        // Format and display due date, add 'overdue' class if applicable
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Midnight for comparison
            dueDate.setHours(0, 0, 0, 0); // Midnight for comparison
            
            // Mark as overdue if due date is in the past and task is not completed
            if (dueDate.getTime() < today.getTime() && !task.completed) {
                dueDateElement.classList.add('overdue');
            }
            
            dueDateElement.textContent = formatDate(dueDate); // Format date for display
        }
        
        // Container for action buttons (edit, delete)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        // Edit button
        const editButton = document.createElement('button');
        editButton.className = 'task-btn';
        editButton.innerHTML = '<i class="fas fa-edit"></i>'; // Font Awesome edit icon
        editButton.addEventListener('click', () => editTask(task.id));
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'task-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>'; // Font Awesome trash icon
        deleteButton.addEventListener('click', () => deleteTask(task.id));
        
        // Append action buttons to their container
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        
        // Append all elements to the task item
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskText);
        taskItem.appendChild(categoryBadge);
        taskItem.appendChild(priorityIndicator);
        taskItem.appendChild(dueDateElement);
        taskItem.appendChild(actionsDiv);
        
        return taskItem;
    }
    
    // Toggles the `completed` status of a specific task
    function toggleTaskComplete(taskId) {
        // Map over the tasks array to find and update the specific task
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                // Return a new object with `completed` status flipped
                return { ...task, completed: !task.completed };
            }
            return task; // Return other tasks unchanged
        });
        
        saveTasks(); // Save changes
        renderTaskList(); // Update UI
        updateStats(); // Update statistics
    }
    
    // Allows editing the text of a task
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId); // Find the task by ID
        if (!task) return; // Exit if task not found
        
        // Prompt user for new text. NOTE: alert() / confirm() / prompt() are usually avoided
        // for better UX; custom modals are preferred.
        const newText = prompt('Edit your task:', task.text);
        
        // If user entered valid new text, update and re-render
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            renderTaskList();
        }
    }
    
    // Deletes a task from the `tasks` array
    function deleteTask(taskId) {
        // Confirmation dialog before deleting
        if (confirm('Are you sure you want to delete this task?')) { // NOTE: See above comment for prompt()
            tasks = tasks.filter(task => task.id !== taskId); // Remove the task
            saveTasks(); // Save changes
            renderTaskList(); // Update UI
            updateStats(); // Update statistics
        }
    }
    
    // --- Statistics Functions ---

    // Updates the display of total, completed, and pending tasks
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksElement.textContent = total;
        completedTasksElement.textContent = completed;
        pendingTasksElement.textContent = pending;
    }
    
    // Provides context-specific messages for empty task lists
    function getEmptyMessage() {
        switch (currentFilter) {
            case 'completed':
                return 'No completed tasks yet. Keep going!';
            case 'today':
                return 'No tasks due today. Add some or enjoy your day!';
            case 'upcoming':
                return 'No upcoming tasks. Add some to plan ahead!';
            case 'all':
            default:
                return 'No tasks yet. Add your first task above!';
        }
    }
    
    // --- Utility Functions ---

    // Formats a Date object into a readable string (e.g., "Jan 1" or "Dec 25, 2024")
    function formatDate(date) {
        const options = { 
            month: 'short', 
            day: 'numeric',
        };
        // Only include the year if it's not the current year
        if (date.getFullYear() !== new Date().getFullYear()) {
            options.year = 'numeric';
        }
        return date.toLocaleDateString('en-US', options);
    }
    
    // --- Theme Functions ---

    // Checks user's preferred theme (from local storage or system preference) and applies it
    function checkThemePreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme'); // Get saved preference
        
        if (savedTheme) {
            setTheme(savedTheme); // Apply saved theme
        } else if (prefersDark) {
            setTheme('dark'); // Apply system preference if no saved theme
        } else {
            setTheme('light'); // Default to light if no preference
        }
    }
    
    // Toggles the theme between 'dark' and 'light'
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme); // Apply the new theme
    }
    
    // Applies the specified theme ('dark' or 'light')
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme); // Set data-theme attribute on <html>
        localStorage.setItem('theme', theme); // Save preference to local storage
        
        // Update the theme switcher icon
        const icon = themeSwitcher.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun'); // Change to sun icon for dark mode
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon'); // Change to moon icon for light mode
        }
    }
    
    // --- Local Storage Functions ---

    // Saves the current `tasks` array to local storage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks)); // Convert array to JSON string
    }
    
    // Loads tasks from local storage into the `tasks` array
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks); // Parse JSON string back to array
        }
    }
    
    // --- Kickstart the Application ---
    init(); // Call the initialization function when the DOM is ready
});
