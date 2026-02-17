let variables = {};
let arrays = {};
let output = [];
let errors = [];
let blockCounter = 0;


class DragAndDrop {
    selectors = {
        root: '[data-js-dnd]',
    };

    stateClasses = {
        isDragging: 'is-dragging',     
    };

    initialState = {
        offsetX: null,
        offsetY: null,
        isDragging: false,
        currentDraggingElement: null,
    };

    constructor() {
        this.state = { ...this.initialState };
        this.bindEvents();             
    }

    resetState() {
        this.state = { ...this.initialState };
    }

    onPointerDown(event) {
        const target = event.target;    
        const draggable = target.closest(this.selectors.root);

        if (!draggable) {
            return;
        }

        event.preventDefault();

        draggable.classList.add(this.stateClasses.isDragging);

        const rect = draggable.getBoundingClientRect(); 

        this.state = {
            offsetX: event.clientX - rect.left,    
            offsetY: event.clientY - rect.top,     
            isDragging: true,
            currentDraggingElement: draggable,
        };
    }

    onPointerMove(event) {
        if (!this.state.isDragging) return;

        event.preventDefault();

        const x = event.pageX - this.state.offsetX; 
        const y = event.pageY - this.state.offsetY; 

        this.state.currentDraggingElement.style.left = `${x}px`; 
        this.state.currentDraggingElement.style.top = `${y}px`;
    }

    onPointerUp() {
        if (!this.state.isDragging) return;

        this.state.currentDraggingElement.classList.remove(this.stateClasses.isDragging);
        this.resetState();
    }

    bindEvents() {
        document.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        document.addEventListener('pointermove', (e) => this.onPointerMove(e));
        document.addEventListener('pointerup', () => this.onPointerUp());
    }
}

function createDraggableBlock(shapeType) {
    const block = document.createElement('div');
    block.className = `block draggable ${shapeType}`;
    block.setAttribute('data-js-dnd', '');

    return block;[]
}


new DragAndDrop();