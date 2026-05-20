// Initial data state updated with humans and machines
let steps = [
  { id: 1, name: 'Spreading & Aligning', batchSize: 100, cycleTime: 45, setupTime: 15, humans: 2, machines: 0 },
  { id: 2, name: 'Marking', batchSize: 100, cycleTime: 20, setupTime: 5, humans: 1, machines: 0 },
  { id: 3, name: 'Machine Cutting', batchSize: 100, cycleTime: 10, setupTime: 10, humans: 1, machines: 1 },
  { id: 4, name: 'Checking & Sorting', batchSize: 1, cycleTime: 1, setupTime: 0, humans: 4, machines: 0 }
];

let capacityChart = null; // Variable to hold our chart instance

// Core calculation logic
function calculateCapacity(step) {
  const totalTimePerBatch = Number(step.cycleTime) + Number(step.setupTime);
  if (totalTimePerBatch === 0) return 0; 
  
  const batchesPerHour = 60 / totalTimePerBatch;
  
  // Treat empty machine inputs as 0
  const activeHumans = Number(step.humans) || 0;
  const activeMachines = Number(step.machines) || 0;
  const totalResources = activeHumans + activeMachines;

  return Math.floor(batchesPerHour * Number(step.batchSize) * totalResources);
}

function getBottleneckId() {
  if (steps.length === 0) return null;
  let minCapacity = Infinity;
  let bId = null;

  steps.forEach(step => {
    const capacity = calculateCapacity(step);
    if (capacity < minCapacity) {
      minCapacity = capacity;
      bId = step.id;
    }
  });
  return bId;
}

// Function to draw and update the Chart
function updateChart() {
  const ctx = document.getElementById('capacityChart').getContext('2d');
  const labels = steps.map(s => s.name);
  const capacities = steps.map(s => calculateCapacity(s));
  const bottleneckId = getBottleneckId();

  // Color the bottleneck red, everything else blue
  const backgroundColors = steps.map(s => 
    s.id === bottleneckId ? 'rgba(239, 68, 68, 0.8)' : 'rgba(37, 99, 235, 0.8)'
  );

  if (capacityChart) {
    // Update existing chart
    capacityChart.data.labels = labels;
    capacityChart.data.datasets[0].data = capacities;
    capacityChart.data.datasets[0].backgroundColor = backgroundColors;
    capacityChart.update();
  } else {
    // Create new chart
    capacityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Capacity (Units/hr)',
          data: capacities,
          backgroundColor: backgroundColors,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'Units per Hour' }
          }
        }
      }
    });
  }
}

// Render the UI
function render() {
  const container = document.getElementById('steps-container');
  container.innerHTML = ''; 
  
  const bottleneckId = getBottleneckId();

  steps.forEach((step, index) => {
    const capacity = calculateCapacity(step);
    const isBottleneck = step.id === bottleneckId;
    
    const article = document.createElement('article');
    article.className = `step-card ${isBottleneck ? 'bottleneck-highlight' : ''}`;
    
    // Updated HTML template for the card
    article.innerHTML = `
      <div class="step-header">
        <h3>
          <span class="step-number">${index + 1}</span>
          <input type="text" class="name-input" data-id="${step.id}" data-field="name" value="${step.name}">
        </h3>
        <button class="remove-btn" onclick="removeStep(${step.id})">Remove</button>
      </div>
      <div class="input-grid">
        <div class="input-group">
          <label>Batch Size (Units)</label>
          <input type="number" min="1" data-id="${step.id}" data-field="batchSize" value="${step.batchSize}">
        </div>
        <div class="input-group">
          <label>Cycle Time (Mins)</label>
          <input type="number" min="0" data-id="${step.id}" data-field="cycleTime" value="${step.cycleTime}">
        </div>
        <div class="input-group">
          <label>Setup/Transit (Mins)</label>
          <input type="number" min="0" data-id="${step.id}" data-field="setupTime" value="${step.setupTime}">
        </div>
        <div class="input-group">
          <label>Humans</label>
          <input type="number" min="0" data-id="${step.id}" data-field="humans" value="${step.humans}">
        </div>
        <div class="input-group">
          <label>Machines</label>
          <input type="number" min="0" placeholder="0" data-id="${step.id}" data-field="machines" value="${step.machines || ''}">
        </div>
      </div>
      <div class="step-results">
        <span><strong>Calculated Capacity:</strong> ${capacity} units/hr</span>
        ${isBottleneck ? '<span class="bottleneck-badge">⚠️ Bottleneck</span>' : ''}
      </div>
    `;
    container.appendChild(article);
  });

  // Attach event listeners
  document.querySelectorAll('#steps-container input').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = Number(e.target.getAttribute('data-id'));
      const field = e.target.getAttribute('data-field');
      const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      updateStep(id, field, value);
    });
  });

  // Draw/Update chart every time the UI renders
  updateChart();
}

function updateStep(id, field, value) {
  const stepIndex = steps.findIndex(s => s.id === id);
  if (stepIndex > -1) {
    steps[stepIndex][field] = value;
    render(); 
  }
}

function addStep() {
  const newId = steps.length > 0 ? Math.max(...steps.map(s => s.id)) + 1 : 1;
  steps.push({ id: newId, name: `New Step ${newId}`, batchSize: 1, cycleTime: 0, setupTime: 0, humans: 1, machines: 0 });
  render();
}

function removeStep(id) {
  steps = steps.filter(step => step.id !== id);
  render();
}

document.getElementById('add-btn').addEventListener('click', addStep);
render();