let taskList = [];


// Función que carga las tareas del fichero tasks.json.
const takeTasks = async () => {

	try {
		const response = await fetch("../tasks.json", {method: 'GET'});
		const data = await response.json();
		return data;

	}
	catch (error) {
		console.log(error);
	}
}


// Función que carga las tareas en el HTML.
const loadTasks = async () => {

	taskList = await takeTasks();

	const taskListElem = document.querySelector("#container");

	while(taskListElem.firstChild){
		taskListElem.removeChild(taskListElem.firstChild);
	}

	let i = 1;
	taskList.forEach(task => {
		const listElem = document.createElement("div");
		listElem.id = "task" + i;
		listElem.innerHTML = `${task.title}`;
		taskListElem.appendChild(listElem);

		if (task.done) {
			listElem.classList.add("done");
		}

		i++;
	});

	// Se cargan el resto de eventos.
	loadRest();
}


// Función que guarda las tareas en el fichero tasks.json usando POST.
const saveTasks = async () => {

	navigator.vibrate(30);

	try {
		await fetch("/tasklist/update", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(taskList, null, 4)
		});
		loadTasks();
	}
	catch (error) {
		console.log("Error al guardar las tareas.");
		console.log(error);
	}
}


// Función que añade una tarea a la lista.
const add = () => {

	const taskName = document.querySelector("#task-name").value;

	if (taskName !== "") {
		const task = {id: taskList.length + 1, title: taskName, done: false};
		taskList.push(task);
		document.querySelector("#task-name").value = "";
		saveTasks();
	}
}


// Función que elimina una tarea de la lista.
const remove = (task) => {

	taskList = taskList.filter(t => !task.id.includes('task' + t.id));

	let i = 1;
	taskList.forEach(task => {
		task.id = i;
		i++;
	});

	saveTasks();
}


// Función que marca una tarea como hecha o por hacer.
const toggleDone = (task) => {

	taskList.forEach(t => {
		if (task.id.includes('task' + t.id)) {
			t.done = !t.done;
		}
	});

	saveTasks();
}


// Función que carga el resto de eventos.
const loadRest = () => {

	let tasks = document.getElementById("container").querySelectorAll('[id^="task"]');

	// Botón de añadir tarea.
	const addButton = document.querySelector("#fab-add");


	// Se añade la tarea al pulsar o hacer click en el botón + y al pulsar enter.
	addButton.addEventListener("touchend", add);
	addButton.addEventListener("click", add);
	document.querySelector("#task-name").addEventListener("keyup", (event) => {
		if (event.keyCode === 13) {
			event.preventDefault();
			addButton.click();
		}
	});


	// Se añaden los eventos a cada tarea.
	tasks.forEach(task => {

		let timer;

		// Comienzo del evento de pulsación larga.
		task.addEventListener("touchstart", () => {
			navigator.vibrate(15);
			timer = setTimeout(() => {
				toggleDone(task);
			}, 2000);
		});

		// Fin del evento de pulsación larga.
		task.addEventListener("touchend", () => {
			clearTimeout(timer);
		});


		let touchStartX, touchEndX, startTime, taskX = 0;
		
		const TIME_THRESHOLD = 300;
		const SPACE_THRESHOLD = 200;
		
		// Comienzo del evento de deslizar.
		task.addEventListener("touchstart", (event) => {
			touchStartX = event.touches[0].clientX;
			taskX = event.touches[0].clientX;
			startTime = event.timeStamp;
		}, {passive: false});

		// Evento de deslizar.
		task.addEventListener("touchmove", (event) => {
			touchEndX = event.touches[0].clientX;
			if (touchEndX - taskX > 0) {
				task.style.transform = "translateX(" + (event.touches[0].clientX - taskX) + "px)";
				task.style.transition = "transform 0s";
			}
		}, {passive: false});

		// Fin del evento de deslizar.
		task.addEventListener("touchend", (event) => {
			endTime = event.timeStamp;
			touchEndX = event.changedTouches[0].clientX;

			if (touchEndX - taskX > SPACE_THRESHOLD && endTime - startTime < TIME_THRESHOLD) {
				task.style.transform = "translateX(100%)";
				task.style.transition = "transform 0.4s";
			}
			else {
				task.style.transform = "translateX(0)";
				task.style.transition = "transform 0.4s";
			}
			
			if (endTime - startTime < TIME_THRESHOLD && touchEndX - touchStartX > SPACE_THRESHOLD) {
				task.style.transform = "translateX(120%)";
				task.style.transition = "transform 0.4s";

				task.addEventListener("transitionend", () => {
					remove(task);
				});
			}
		});
	});
}


// Cargamos las tareas al pulsar empezar.
const start_button = document.querySelector("#start-button");

start_button.addEventListener("click", () => {
	
	document.querySelector("#initial-screen").style.display = "none";
	document.querySelector("#header").style.display = "flex";
	document.querySelector("#content").style.display = "block";
	document.querySelector("#add-task-container").style.display = "flex";

	loadTasks();
});
