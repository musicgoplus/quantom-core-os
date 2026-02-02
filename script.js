// Wait for environment variables to load, then initialize Firebase
(async () => {
    // Wait for envLoader to be ready
    await new Promise(resolve => {
        if (envLoader && envLoader.env && Object.keys(envLoader.env).length > 0) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (envLoader && envLoader.env && Object.keys(envLoader.env).length > 0) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            setTimeout(resolve, 3000); // Fallback timeout
        }
    });

    // Initialize Firebase with environment variables
    const firebaseConfig = {
        apiKey: envLoader.get('FIREBASE_API_KEY', 'AIzaSyBjZgEPAivAgxFJP0x1QA8Rr04uZxqwJcs'),
        authDomain: envLoader.get('FIREBASE_AUTH_DOMAIN', 'boxsim.firebaseapp.com'),
        databaseURL: envLoader.get('FIREBASE_DATABASE_URL', 'https://boxsim-default-rtdb.asia-southeast1.firebasedatabase.app'),
        projectId: envLoader.get('FIREBASE_PROJECT_ID', 'boxsim'),
        storageBucket: envLoader.get('FIREBASE_STORAGE_BUCKET', 'boxsim.firebasestorage.app'),
        messagingSenderId: envLoader.get('FIREBASE_MESSAGING_SENDER_ID', '978064446117'),
        appId: envLoader.get('FIREBASE_APP_ID', '1:978064446117:web:77bcb08ac6dd8c7c0ff34c')
    };

    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();

    // Check if user is already logged in
    checkAuthStatus();

    // Setup data listeners once Firebase is ready
    setupDataListeners();

    console.log('Firebase initialized with environment variables');
})();

let db;
let auth;
let currentUser = null;

let shelvingDatabase = [];
let currentRackId = null; 
let currentBoxId = null;  
let highlightedBlockId = null; // Track which block to light up

// --- AUTHENTICATION FUNCTIONS ---
function checkAuthStatus() {
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            // User is logged in, show main app
            showMainApp();
        } else {
            // User is not logged in, show auth page
            showAuthPage();
        }
    });
}

function switchForm(formType) {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('auth-success').classList.remove('active');
    
    if (formType === 'login') {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('login-error').innerText = '';
    } else if (formType === 'signup') {
        document.getElementById('signup-form').classList.add('active');
        document.getElementById('signup-error').innerText = '';
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.innerText = 'Authenticating...';
    errorDiv.style.color = 'var(--primary)';
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            showAuthSuccess();
        })
        .catch((error) => {
            errorDiv.innerText = `Error: ${error.message}`;
            errorDiv.style.color = '#ff4d4d';
        });
}

function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errorDiv = document.getElementById('signup-error');
    
    // Validate password match
    if (password !== confirm) {
        errorDiv.innerText = 'Passwords do not match!';
        errorDiv.style.color = '#ff4d4d';
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        errorDiv.innerText = 'Password must be at least 6 characters!';
        errorDiv.style.color = '#ff4d4d';
        return;
    }
    
    errorDiv.innerText = 'Creating account...';
    errorDiv.style.color = 'var(--primary)';
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            
            // Update profile with username
            currentUser.updateProfile({
                displayName: username
            }).then(() => {
                // Save user data to database
                db.ref('users/' + currentUser.uid).set({
                    username: username,
                    email: email,
                    createdAt: new Date().toISOString()
                });
                
                showAuthSuccess();
            });
        })
        .catch((error) => {
            errorDiv.innerText = `Error: ${error.message}`;
            errorDiv.style.color = '#ff4d4d';
        });
}

function showAuthSuccess() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('auth-success').classList.add('active');
}

function continueToMain() {
    showMainApp();
}

function showAuthPage() {
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('main-container').style.display = 'none';
}

function showMainApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    
    // Trigger data listeners
    if (db) {
        setupDataListeners();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut().then(() => {
            currentUser = null;
            // Clear form data
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            document.getElementById('signup-username').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-confirm').value = '';
            
            // Reset to login form
            switchForm('login');
            showAuthPage();
        });
    }
}

function setupDataListeners() {
    if (!db) return;
    
    // --- DATA LISTENER ---
    db.ref('inventory').on('value', (snapshot) => {
        const data = snapshot.val();
        shelvingDatabase = data ? Object.keys(data).map(key => ({
            id: key,
            boxes: data[key].boxes || []
        })) : [];
        
        updateStats();
        renderShelfGrid();
        renderDatabase();
        
        if (currentRackId !== null) {
            refreshRackView();
            if (currentBoxId !== null) updateBoxFileList();
        }
    });

    // --- NOTES LISTENER ---
    db.ref('notes').on('value', (snapshot) => {
        const notesData = snapshot.val();
        const grid = document.getElementById('sticky-notes-grid');
        if (!grid) return;

        let html = '';
        if (notesData) {
            Object.keys(notesData).forEach(id => {
                const note = notesData[id];
                html += `
                    <div class="card-cyber note-item" style="padding: 10px; border-left: 3px solid var(--primary); background: rgba(0, 242, 255, 0.05); position: relative;">
                        <button onclick="deleteNote('${id}')" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 0.7rem;">
                            <i class="fas fa-times"></i>
                        </button>
                        <p style="font-size: 0.85rem; line-height: 1.4; margin-bottom: 8px;">${note.text}</p>
                        <div style="font-size: 0.65rem; opacity: 0.6; text-align: right;">${note.time}</div>
                    </div>
                `;
            });
        } else {
            html = `<div style="grid-column: 1/-1; text-align: center; opacity: 0.4; padding: 40px;">NO ACTIVE MEMORIES</div>`;
        }
        grid.innerHTML = html;
    });
}


// --- NAVIGATION ---
function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}

// --- NODE MANAGEMENT ---
function openRack(nodeId, blockId = null) {
    currentRackId = nodeId;
    highlightedBlockId = blockId; // Store block ID to highlight it
    showSection('single-shelf-view');
    refreshRackView();

    // Auto-scroll to the highlighted block if it exists
    if (blockId) {
        setTimeout(() => {
            const el = document.getElementById(`block-card-${blockId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

function refreshRackView() {
    const rack = shelvingDatabase.find(r => r.id === currentRackId);
    if (!rack) return;
    document.getElementById('current-rack-title').innerText = `NODE: ${rack.id}`;
    
    let html = `<div class="card-cyber" onclick="addBlock()" style="cursor:pointer; border: 2px dashed var(--border); text-align:center; min-height:120px; display:flex; flex-direction:column; justify-content:center;">
                    <i class="fas fa-plus"></i> ADD BLOCK
                </div>`;
                
    html += (rack.boxes || []).map((box) => {
        // Logic to apply the "Light Up" class
        const isHighlighted = (highlightedBlockId && highlightedBlockId.toString() === box.id.toString());
        const highlightClass = isHighlighted ? 'highlight-glow' : '';

        return `
        <div class="card-cyber ${highlightClass}" id="block-card-${box.id}" style="text-align:center; position:relative;">
            <button onclick="deleteBlock('${box.id}')" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#ff4d4d; cursor:pointer;">
                <i class="fas fa-trash"></i>
            </button>
            <i class="fas fa-cube" style="color: var(--primary); margin-bottom:10px;"></i>
            <h4>BLOCK ${box.id}</h4>
            <button class="btn-cyber-main" onclick="openBox('${box.id}')">OPEN</button>
        </div>
        `;
    }).join('');
    document.getElementById('box-grid').innerHTML = html;

    // Optional: Turn off the "Light" after 4 seconds
    if (highlightedBlockId) {
        setTimeout(() => {
            const el = document.getElementById(`block-card-${highlightedBlockId}`);
            if (el) el.classList.remove('highlight-glow');
            highlightedBlockId = null;
        }, 4000);
    }
}

// --- DATA RECORDS TABLE ---
function renderDatabase() {
    let html = '';
    shelvingDatabase.forEach(node => {
        (node.boxes || []).forEach(box => {
            (box.files || []).forEach(f => {
                // Modified: Now passes both Node ID and Block ID
                html += `<tr>
                    <td>${box.id}</td>
                    <td onclick="openRack('${node.id}', '${box.id}')" class="node-link" style="color: var(--primary); cursor: pointer; font-weight: bold;">
                        <i class="fas fa-project-diagram" style="font-size: 0.7rem; margin-right: 5px;"></i>${node.id}
                    </td>
                    <td>${f.date}</td>
                    <td>${f.fileNumber}</td>
                    <td>${f.fullName}</td>
                    <td>${f.label}</td>
                    <td>
                        <button onclick="deleteRecord('${node.id}', '${box.id}', '${f.fileNumber}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
            });
        });
    });
    document.getElementById('db-body').innerHTML = html;
}

// --- FILE MANAGEMENT & BUG FIXES ---
function addFile() {
    const rack = shelvingDatabase.find(r => r.id === currentRackId);
    if (!rack) return;
    const boxes = [...rack.boxes];
    const boxIndex = boxes.findIndex(b => b.id.toString() === currentBoxId.toString());
    if (boxIndex === -1) return;

    const fileId = document.getElementById('file-number').value.trim();
    const fullName = document.getElementById('full-name').value.trim();

    if (!fileId || !fullName) return alert("CRITICAL ERROR: MISSING REQUIRED DATA FIELDS");

    let isDuplicate = false;
    shelvingDatabase.forEach(node => {
        (node.boxes || []).forEach(box => {
            (box.files || []).forEach(f => {
                // FIXED: Changed f.full-name (invalid) to f.fullName
                if (f.fileNumber.toLowerCase() === fileId.toLowerCase()) {
                    alert(`ACCESS DENIED: ID [${fileId}] is already registered to ${f.fullName}.`);
                    isDuplicate = true;
                }
                if (f.fullName.toLowerCase() === fullName.toLowerCase()) {
                    alert(`ACCESS DENIED: Subject [${fullName}] already exists in the system under ID ${f.fileNumber}.`);
                    isDuplicate = true;
                }
            });
        });
    });

    if (isDuplicate) return;

    const file = {
        fileNumber: fileId,
        fullName: fullName,
        label: document.getElementById('entry-label').value || "N/A",
        date: document.getElementById('entry-date').value || new Date().toISOString().split('T')[0]
    };

    if (!boxes[boxIndex].files) boxes[boxIndex].files = [];
    boxes[boxIndex].files.push(file);
    
    db.ref('inventory/' + currentRackId).update({ boxes: boxes }).then(() => {
        document.getElementById('file-number').value = '';
        document.getElementById('full-name').value = '';
    }).catch(error => {
        alert("COMMUNICATION ERROR: " + error.message);
    });
}

function updateBoxFileList() {
    const rack = shelvingDatabase.find(r => r.id === currentRackId);
    if (!rack) return;
    const box = (rack.boxes || []).find(b => b.id.toString() === currentBoxId.toString());
    const displayElement = document.getElementById('box-num-display');
    const listElement = document.getElementById('current-box-list');

    if (box) {
        displayElement.innerText = `BLOCK: ${box.id}`;
        const filesHtml = (box.files || []).map(f => `
            <div class="card-cyber" style="margin-bottom:10px; border-left: 3px solid var(--primary); padding:10px; background: rgba(0,0,0,0.1);">
                <div style="font-size: 0.8rem; color: var(--primary); opacity: 0.8; margin-bottom: 4px;">ID: ${f.fileNumber}</div>
                <strong style="display: block; margin-bottom: 2px;">${f.fullName}</strong>
                <span style="font-size: 0.75rem; opacity: 0.6;">LABEL: ${f.label}</span>
            </div>
        `).join('');
        listElement.innerHTML = filesHtml || `<div style="text-align:center; opacity:0.5; padding: 20px;">NO RECORDS IN THIS SECTOR</div>`;
    } else {
        listElement.innerHTML = "Empty Sector";
    }
}

// --- UTILITIES (ADD/DELETE/STATS) ---
function addNode() {
    let maxNum = 0;
    shelvingDatabase.forEach(node => {
        const match = node.id.match(/NODE-(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    const nodeId = "NODE-" + (maxNum + 1);
    db.ref('inventory/' + nodeId).set({ initialized: true, boxes: [] });
}

function addBlock() {
    const rack = shelvingDatabase.find(r => r.id === currentRackId);
    if (!rack) return;
    const boxes = rack.boxes ? [...rack.boxes] : [];
    let maxBoxId = 0;
    boxes.forEach(b => { if (b.id > maxBoxId) maxBoxId = b.id; });
    boxes.push({ id: maxBoxId + 1, files: [] });
    db.ref('inventory/' + currentRackId).update({ boxes: boxes });
}

function deleteNode(nodeId) {
    if (confirm(`SYSTEM ALERT: Permanently purge ${nodeId}?`)) {
        db.ref('inventory/' + nodeId).remove().then(() => {
            if (currentRackId === nodeId) { currentRackId = null; showSection('dashboard'); }
        });
    }
}

function deleteBlock(boxId) {
    if (confirm(`SYSTEM ALERT: Purge BLOCK ${boxId}?`)) {
        const rack = shelvingDatabase.find(r => r.id === currentRackId);
        if (!rack) return;
        const updatedBoxes = (rack.boxes || []).filter(b => b.id.toString() !== boxId.toString());
        db.ref('inventory/' + currentRackId).update({ boxes: updatedBoxes }).then(() => {
            if (currentBoxId && currentBoxId.toString() === boxId.toString()) {
                currentBoxId = null;
                showSection('single-shelf-view');
            }
        });
    }
}

function deleteRecord(nodeId, boxId, fileNumber) {
    if (!confirm(`PURGE RECORD ${fileNumber}?`)) return;
    const node = shelvingDatabase.find(n => n.id === nodeId);
    if (!node) return;
    const updatedBoxes = node.boxes.map(box => {
        if (box.id.toString() === boxId.toString()) {
            return { ...box, files: box.files.filter(f => f.fileNumber !== fileNumber) };
        }
        return box;
    });
    db.ref('inventory/' + nodeId).update({ boxes: updatedBoxes });
}

function updateStats() {
    let n = shelvingDatabase.length, b = 0, f = 0;
    shelvingDatabase.forEach(node => {
        b += (node.boxes || []).length;
        (node.boxes || []).forEach(box => f += (box.files || []).length);
    });
    document.getElementById('stat-racks').innerText = n;
    document.getElementById('stat-boxes').innerText = b;
    document.getElementById('stat-files').innerText = f;
}

function renderShelfGrid() {
    const grid = document.getElementById('shelf-grid');
    grid.innerHTML = shelvingDatabase.map((node) => `
        <div class="card-cyber" style="text-align:center; position:relative;">
            <button onclick="deleteNode('${node.id}')" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#ff4d4d; cursor:pointer;">
                <i class="fas fa-trash"></i>
            </button>
            <i class="fas fa-server" style="font-size: 2rem; color: var(--primary);"></i>
            <h3>${node.id}</h3>
            <button class="btn-cyber-main" onclick="openRack('${node.id}')">ACCESS</button>
        </div>
    `).join('');
}

function openBox(boxId) {
    currentBoxId = boxId;
    showSection('box-detail-view');
    updateBoxFileList();
}

function exportToCSV() {
    let rows = [["BLOCK", "NODE", "DATE", "ID", "SUBJECT", "LABEL"]];
    shelvingDatabase.forEach(node => {
        (node.boxes || []).forEach(box => {
            (box.files || []).forEach(f => {
                rows.push([box.id, node.id, f.date, f.fileNumber, f.fullName, f.label]);
            });
        });
    });
    let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    let link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "quantum_export.csv");
    document.body.appendChild(link);
    link.click();
}

function printTable() { window.print(); }

function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
}

window.onload = () => {
    showSection('dashboard');
    setInterval(() => {
        const now = new Date();
        document.getElementById('live-clock').innerText = now.toLocaleTimeString();
        document.getElementById('live-date').innerText = now.toLocaleDateString();
    }, 1000);
};

let storageChart = null; // Global variable to track the chart instance

function updateStorageChart() {
    const ctx = document.getElementById('storageChart');
    if (!ctx) return;

    // 1. Prepare Data: Map labels (Node IDs) and data (Count of Files)
    const labels = shelvingDatabase.map(node => node.id);
    const dataPoints = shelvingDatabase.map(node => {
        let fileCount = 0;
        (node.boxes || []).forEach(box => {
            fileCount += (box.files || []).length;
        });
        return fileCount;
    });

    // 2. Destroy previous chart instance if it exists to prevent memory leaks
    if (storageChart) {
        storageChart.destroy();
    }

    // 3. Initialize Chart.js
    storageChart = new Chart(ctx, {
        type: 'bar', // You can change this to 'doughnut' or 'polarArea'
        data: {
            labels: labels,
            datasets: [{
                label: 'Records',
                data: dataPoints,
                backgroundColor: 'rgba(0, 242, 255, 0.2)',
                borderColor: '#00f2ff',
                borderWidth: 2,
                hoverBackgroundColor: 'rgba(0, 242, 255, 0.5)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#00f2ff' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#e0e0ff' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 4. Update your existing Firebase listener to refresh the chart
db.ref('inventory').on('value', (snapshot) => {
    // ... your existing code to update shelvingDatabase ...
    
    updateStorageChart(); // Trigger chart refresh
});

// --- STICKY NOTE LOGIC ---

function addStickyNote() {
    const noteText = document.getElementById('note-text').value.trim();
    if (!noteText) return;

    const noteId = 'NOTE-' + Date.now();
    const timestamp = new Date().toLocaleTimeString();

    db.ref('notes/' + noteId).set({
        text: noteText,
        time: timestamp,
        pinned: true
    }).then(() => {
        document.getElementById('note-text').value = '';
    });
}

function deleteNote(noteId) {
    db.ref('notes/' + noteId).remove();
}