let variables = {};
let output = [];
let errors = [];
let blocks = [];

function allowDrop(event) {
    event.preventDefault();
    document.getElementById('workspace').classList.add('drag-over');
}

function drop(event) {
    event.preventDefault();
    const workspace = document.getElementById('workspace');
    workspace.classList.remove('drag-over');
    
    const nodeType = event.dataTransfer.getData('text/plain');
    if (!nodeType) return;
    
    const rect = workspace.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    createBlock(nodeType, x, y);
}

document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.node-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', function(event) {
            event.dataTransfer.setData('text/plain', this.dataset.nodeType);
            this.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', function(event) {
            this.style.opacity = '1';
        });
    });
});

function createBlock(type, x, y) {
    const workspace = document.getElementById('workspace');
    const blockId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const placeholder = workspace.querySelector('.workspace-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const block = document.createElement('div');
    block.className = 'workspace-block';
    block.id = blockId;
    block.style.position = 'absolute';
    block.style.left = x + 'px';
    block.style.top = y + 'px';
    
    let content = '';
    let title = '';
    
    switch(type) {
        case 'var-declare':
            title = 'Создать переменную';
            content = '<input type="text" value="x, y" placeholder="имена" onchange="updateBlockData(\'' + blockId + '\', \'names\', this.value)">';
            break;
        case 'var-assign':
            title = 'Присвоить значение';
            content = '<input type="text" value="x" placeholder="переменная" style="width:70px" onchange="updateBlockData(\'' + blockId + '\', \'var\', this.value)"> = <input type="text" value="0" placeholder="значение" style="width:70px" onchange="updateBlockData(\'' + blockId + '\', \'value\', this.value)">';
            break;
        case 'math-add':
            title = 'Сложение';
            content = '<input type="text" value="a" placeholder="a" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'a\', this.value)"> + <input type="text" value="b" placeholder="b" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'b\', this.value)">';
            break;
        case 'math-sub':
            title = 'Вычитание';
            content = '<input type="text" value="a" placeholder="a" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'a\', this.value)"> - <input type="text" value="b" placeholder="b" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'b\', this.value)">';
            break;
        case 'math-mul':
            title = 'Умножение';
            content = '<input type="text" value="a" placeholder="a" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'a\', this.value)"> * <input type="text" value="b" placeholder="b" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'b\', this.value)">';
            break;
        case 'math-div':
            title = 'Деление';
            content = '<input type="text" value="a" placeholder="a" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'a\', this.value)"> / <input type="text" value="b" placeholder="b" style="width:60px" onchange="updateBlockData(\'' + blockId + '\', \'b\', this.value)">';
            break;
        case 'print':
            title = 'Вывести';
            content = '<input type="text" value="0" placeholder="значение" onchange="updateBlockData(\'' + blockId + '\', \'value\', this.value)">';
            break;
        default:
            title = type;
            content = '';
    }
    
    block.innerHTML = `
        <div class="block-header" onmousedown="startDragBlock('${blockId}', event)">
            <span>${title}</span>
            <button class="delete-btn" onclick="deleteBlock('${blockId}')">✕</button>
        </div>
        <div class="block-content" id="content_${blockId}">
            ${content}
        </div>
    `;
    
    workspace.appendChild(block);
    
    const blockData = {
        id: blockId,
        type: type,
        data: {}
    };
    
    blocks.push(blockData);
    updateUI();
}

function updateBlockData(blockId, field, value) {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
        block.data[field] = value;
    }
}

function startDragBlock(blockId, event) {
    const block = document.getElementById(blockId);
    if (!block) return;
    
    event.preventDefault();
    
    const startX = event.clientX;
    const startY = event.clientY;
    const blockLeft = parseFloat(block.style.left) || 0;
    const blockTop = parseFloat(block.style.top) || 0;
    
    function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        block.style.left = (blockLeft + dx) + 'px';
        block.style.top = (blockTop + dy) + 'px';
    }
    
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function deleteBlock(blockId) {
    const block = document.getElementById(blockId);
    if (block) {
        block.remove();
        blocks = blocks.filter(b => b.id !== blockId);
        updateUI();
    }
}

function runProgram() {
    output = [];
    errors = [];
    
    output.push('Запуск программы...');
    
    blocks.forEach(block => {
        try {
            executeBlock(block);
        } catch (e) {
            errors.push('Ошибка: ' + e.message);
        }
    });
    
    output.push('Готово');
    updateOutput();
    updateErrors();
}

function executeBlock(block) {
    const blockEl = document.getElementById(block.id);
    if (!blockEl) return;
    
    const inputs = blockEl.querySelectorAll('input');
    
    switch(block.type) {
        case 'var-declare':
            const names = inputs[0].value.split(',').map(n => n.trim());
            names.forEach(name => variables[name] = 0);
            output.push('Созданы: ' + names.join(', '));
            break;
            
        case 'var-assign':
            const varName = inputs[0].value;
            const val = evaluateExpression(inputs[1].value);
            variables[varName] = val;
            output.push(varName + ' = ' + val);
            break;
            
        case 'math-add':
            const a = evaluateExpression(inputs[0].value);
            const b = evaluateExpression(inputs[1].value);
            output.push('Сложение: ' + a + ' + ' + b + ' = ' + (a + b));
            break;
            
        case 'math-sub':
            const a1 = evaluateExpression(inputs[0].value);
            const b1 = evaluateExpression(inputs[1].value);
            output.push('Вычитание: ' + a1 + ' - ' + b1 + ' = ' + (a1 - b1));
            break;
            
        case 'math-mul':
            const a2 = evaluateExpression(inputs[0].value);
            const b2 = evaluateExpression(inputs[1].value);
            output.push('Умножение: ' + a2 + ' * ' + b2 + ' = ' + (a2 * b2));
            break;
            
        case 'math-div':
            const a3 = evaluateExpression(inputs[0].value);
            const b3 = evaluateExpression(inputs[1].value);
            if (b3 === 0) {
                errors.push('Деление на ноль');
            } else {
                output.push('Деление: ' + a3 + ' / ' + b3 + ' = ' + (a3 / b3));
            }
            break;
            
        case 'print':
            const value = evaluateExpression(inputs[0].value);
            output.push('> ' + value);
            break;
    }
    
    updateVariables();
}

function evaluateExpression(expr) {
    if (typeof expr !== 'string') return expr;
    
    let result = expr;
    for (let name in variables) {
        result = result.replace(new RegExp('\\b' + name + '\\b', 'g'), variables[name]);
    }
    
    try {
        return Function('"use strict";return (' + result + ')')();
    } catch {
        return expr;
    }
}

function resetProgram() {
    variables = {};
    output = [];
    errors = [];
    updateVariables();
    updateOutput();
    updateErrors();
}

function clearAll() {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = '<div class="workspace-placeholder">Перетащите блоки сюда</div>';
    blocks = [];
    resetProgram();
    updateUI();
}

function updateVariables() {
    const list = document.getElementById('variablesList');
    let html = '';
    
    for (let name in variables) {
        html += '<div class="variable-item"><span class="variable-name">' + name + '</span> <span class="variable-value">' + variables[name] + '</span></div>';
    }
    
    if (html === '') {
        html = 'Нет переменных';
    }
    
    list.innerHTML = html;
}

function updateOutput() {
    const console = document.getElementById('outputConsole');
    console.innerHTML = output.map(line => '<div class="console-line">' + line + '</div>').join('');
}

function updateErrors() {
    const list = document.getElementById('errorsList');
    if (errors.length === 0) {
        list.innerHTML = 'Ошибок нет';
    } else {
        list.innerHTML = errors.map(err => '<div class="error-item">⚠️ ' + err + '</div>').join('');
    }
}

function updateUI() {
    document.getElementById('nodeCount').textContent = blocks.length;
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const tabId = tab.dataset.tab;
        document.getElementById(tabId + 'Tab').classList.add('active');
    });
});