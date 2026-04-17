// ===== STATE =====
let currentUser = null; // 'admin' or 'user'
let selectedBook = null;

const authorMap = {
  'A Brief History of Time': 'Stephen Hawking',
  '1984': 'George Orwell',
  'Harry Potter': 'J.K. Rowling',
  'The Tipping Point': 'Malcolm Gladwell',
  'Surely You\'re Joking Mr. Feynman': 'Richard Feynman',
  'Sapiens': 'Yuval Harari'
};

const bookData = [
  {name:'A Brief History of Time', author:'Stephen Hawking', serial:'SC-B-000001', available:true},
  {name:'1984', author:'George Orwell', serial:'FC-B-000001', available:false},
  {name:'Harry Potter', author:'J.K. Rowling', serial:'FC-B-000002', available:true},
  {name:'The Tipping Point', author:'Malcolm Gladwell', serial:'PD-B-000001', available:true},
  {name:'Surely You\'re Joking Mr. Feynman', author:'Richard Feynman', serial:'SC-B-000002', available:false},
  {name:'Sapiens', author:'Yuval Harari', serial:'PD-B-000003', available:false},
];

// ===== NAVIGATION =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
  // Show/hide maintenance link based on role
  if(id==='page-reports') {
    document.getElementById('rep-maint-link').style.display = currentUser==='admin' ? 'block' : 'none';
  }
  if(id==='page-transactions') {
    const el = document.getElementById('txn-maint-link');
    if(el) el.style.display = currentUser==='admin' ? 'block' : 'none';
  }
}

function goHome() {
  if(currentUser==='admin') showPage('page-admin-home');
  else showPage('page-user-home');
}

function logout() { currentUser=null; showPage('page-logout'); }

// ===== LOGIN =====
let loginRole = 'admin';
function selectLoginTab(role, el) {
  loginRole = role;
  document.querySelectorAll('.login-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('login-id').value = '';
  document.getElementById('login-pwd').value = '';
  document.getElementById('login-error').style.display = 'none';
}

function doLogin() {
  const id = document.getElementById('login-id').value.trim();
  const pwd = document.getElementById('login-pwd').value.trim();
  const err = document.getElementById('login-error');
  if(loginRole==='admin' && id==='adm' && pwd==='adm') {
    currentUser='admin'; err.style.display='none'; showPage('page-admin-home');
  } else if(loginRole==='user' && id==='user' && pwd==='user') {
    currentUser='user'; err.style.display='none'; showPage('page-user-home');
  } else {
    err.style.display='block';
  }
}

// ===== TRANSACTIONS =====
function showTxn(type, el) {
  ['available','issue','return','fine'].forEach(t => {
    document.getElementById('txn-'+t).style.display = t===type ? 'block' : 'none';
  });
  document.querySelectorAll('.txn-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  // Set today's date for issue
  if(type==='issue') {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('issue-date').value = today;
    document.getElementById('issue-date').min = today;
    setReturnDate();
  }
}

function searchBooks() {
  const name = document.getElementById('avail-name').value.trim().toLowerCase();
  const author = document.getElementById('avail-author').value;
  const err = document.getElementById('avail-error');
  if(!name && !author) { err.style.display='block'; return; }
  err.style.display='none';
  const results = bookData.filter(b => {
    const matchName = !name || b.name.toLowerCase().includes(name);
    const matchAuthor = !author || b.author===author;
    return matchName && matchAuthor;
  });
  const tbody = document.getElementById('search-tbody');
  tbody.innerHTML = '';
  if(results.length===0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No books found</td></tr>';
  } else {
    results.forEach(b => {
      tbody.innerHTML += `<tr>
        <td>${b.name}</td><td>${b.author}</td><td>${b.serial}</td>
        <td>${b.available ? '<span class="badge badge-green">Yes</span>' : '<span class="badge badge-red">No</span>'}</td>
        <td>${b.available ? `<input type="radio" name="book-select" value="${b.name}">` : '—'}</td>
      </tr>`;
    });
  }
  document.getElementById('search-results').style.display='block';
}

function proceedToIssue() {
  const sel = document.querySelector('input[name="book-select"]:checked');
  if(!sel) { alert('Please select a book to issue.'); return; }
  selectedBook = sel.value;
  document.getElementById('issue-book').value = selectedBook;
  fillIssueAuthor();
  showTxn('issue', document.querySelectorAll('.txn-btn')[1]);
}

function fillIssueAuthor() {
  const book = document.getElementById('issue-book').value;
  document.getElementById('issue-author').value = authorMap[book] || '';
  setReturnDate();
}

function setReturnDate() {
  const issueDate = document.getElementById('issue-date').value;
  if(issueDate) {
    const d = new Date(issueDate);
    d.setDate(d.getDate()+15);
    const ret = d.toISOString().split('T')[0];
    document.getElementById('issue-return').value = ret;
    document.getElementById('issue-return').max = ret;
    document.getElementById('issue-return').min = issueDate;
  }
}

document.getElementById('issue-date').addEventListener('change', setReturnDate);

function submitIssue() {
  const book = document.getElementById('issue-book').value;
  const issueDate = document.getElementById('issue-date').value;
  const returnDate = document.getElementById('issue-return').value;
  const err = document.getElementById('issue-error');
  if(!book || !issueDate || !returnDate) {
    err.textContent = 'Book name, issue date and return date are required.';
    err.style.display='block'; return;
  }
  // Validate dates
  const today = new Date().toISOString().split('T')[0];
  if(issueDate < today) {
    err.textContent = 'Issue date cannot be in the past.';
    err.style.display='block'; return;
  }
  const maxReturn = new Date(issueDate);
  maxReturn.setDate(maxReturn.getDate()+15);
  if(new Date(returnDate) > maxReturn) {
    err.textContent = 'Return date cannot be more than 15 days from issue date.';
    err.style.display='block'; return;
  }
  err.style.display='none';
  document.getElementById('confirm-msg').textContent = `"${book}" has been issued. Due back by ${returnDate}.`;
  showPage('page-confirm');
}

function fillReturnDetails() {
  const book = document.getElementById('return-book').value;
  document.getElementById('return-author').value = authorMap[book] || '';
  document.getElementById('return-issue-date').value = '2025-03-01';
  const d = new Date('2025-03-01');
  d.setDate(d.getDate()+15);
  document.getElementById('return-date').value = d.toISOString().split('T')[0];
}

function submitReturn() {
  const book = document.getElementById('return-book').value;
  const serial = document.getElementById('return-serial').value;
  const returnDate = document.getElementById('return-date').value;
  const err = document.getElementById('return-error');
  if(!book || !serial || !returnDate) {
    err.textContent = 'Book name, serial number and return date are required.';
    err.style.display='block'; return;
  }
  err.style.display='none';
  showPage('page-confirm');
  document.getElementById('confirm-msg').textContent = `"${book}" (${serial}) has been returned. Proceeding to fine check.`;
}

function calcFine() {
  const returnDate = new Date(document.getElementById('fine-return').value);
  const actualDate = new Date(document.getElementById('fine-actual').value);
  if(actualDate > returnDate) {
    const days = Math.ceil((actualDate - returnDate) / (1000*60*60*24));
    document.getElementById('fine-amt').textContent = '₹ ' + (days * 5);
    document.getElementById('fine-display').style.borderColor = 'rgba(231,76,60,0.5)';
  } else {
    document.getElementById('fine-amt').textContent = '₹ 0';
    document.getElementById('fine-display').style.borderColor = 'rgba(39,174,96,0.3)';
  }
}

function submitFine() {
  const fineText = document.getElementById('fine-amt').textContent.trim();
  const fineAmt = parseInt(fineText.replace('₹','').trim()) || 0;
  const finePaid = document.getElementById('fine-paid').checked;
  const err = document.getElementById('fine-error');
  if(fineAmt > 0 && !finePaid) {
    err.textContent = 'Please check "Fine Paid" before completing the return transaction.';
    err.style.display='block'; return;
  }
  err.style.display='none';
  document.getElementById('confirm-msg').textContent = `Return transaction completed. Fine collected: ${fineAmt > 0 ? fineText : '₹0 (no fine)'}`;
  showPage('page-confirm');
}

// ===== REPORTS =====
function showReport(type, el) {
  ['books','movies','memberships','active','overdue','requests'].forEach(r => {
    document.getElementById('report-'+r).style.display = r===type ? 'block' : 'none';
  });
  document.querySelectorAll('#page-reports .sidebar-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
}

// ===== MAINTENANCE =====
function showMaint(type, el) {
  ['add-member','update-member','add-book','update-book','user-mgmt'].forEach(m => {
    const el2 = document.getElementById('maint-'+m);
    if(el2) el2.style.display = m===type ? 'block' : 'none';
  });
  document.querySelectorAll('#page-maintenance .sidebar-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
}

function submitAddMember() {
  const fields = ['am-fname','am-lname','am-contact','am-aadhar','am-address','am-start','am-end'];
  const err = document.getElementById('am-error');
  if(fields.some(f => !document.getElementById(f).value.trim())) {
    err.style.display='block'; return;
  }
  err.style.display='none';
  document.getElementById('confirm-msg').textContent = `Membership for "${document.getElementById('am-fname').value} ${document.getElementById('am-lname').value}" has been added successfully.`;
  showPage('page-confirm');
}

function submitUpdateMember() {
  const id = document.getElementById('um-id').value.trim();
  const err = document.getElementById('um-error');
  if(!id) { err.style.display='block'; return; }
  err.style.display='none';
  document.getElementById('confirm-msg').textContent = `Membership ${id} has been updated.`;
  showPage('page-confirm');
}

function loadMember() {
  const id = document.getElementById('um-id').value.trim();
  if(id==='MEM-001') {
    document.getElementById('um-start').value = '2024-01-01';
    document.getElementById('um-end').value = '2025-01-01';
  } else if(id==='MEM-002') {
    document.getElementById('um-start').value = '2024-03-15';
    document.getElementById('um-end').value = '2025-03-15';
  }
}

function submitAddBook() {
  const fields = ['ab-name','ab-author','ab-category','ab-cost','ab-date','ab-qty'];
  const err = document.getElementById('ab-error');
  if(fields.some(f => !document.getElementById(f).value.trim())) {
    err.style.display='block'; return;
  }
  err.style.display='none';
  document.getElementById('confirm-msg').textContent = `"${document.getElementById('ab-name').value}" has been added to the library.`;
  showPage('page-confirm');
}

function submitUpdateBook() {
  const fields = ['ub-name','ub-serial','ub-status','ub-date'];
  const err = document.getElementById('ub-error');
  if(fields.some(f => !document.getElementById(f).value.trim())) {
    err.style.display='block'; return;
  }
  err.style.display='none';
  document.getElementById('confirm-msg').textContent = `Book record updated successfully.`;
  showPage('page-confirm');
}

function submitUserMgmt() {
  const name = document.getElementById('usr-name').value.trim();
  const err = document.getElementById('usr-error');
  if(!name) { err.style.display='block'; return; }
  err.style.display='none';
  document.getElementById('confirm-msg').textContent = `User "${name}" has been saved.`;
  showPage('page-confirm');
}

function clearForm(form) {
  if(form==='add-member') {
    ['am-fname','am-lname','am-contact','am-aadhar','am-address','am-start','am-end'].forEach(f => document.getElementById(f).value='');
    document.getElementById('am-error').style.display='none';
  } else if(form==='add-book') {
    ['ab-name','ab-author','ab-cost','ab-date'].forEach(f => document.getElementById(f).value='');
    document.getElementById('ab-category').value='';
    document.getElementById('ab-qty').value='1';
    document.getElementById('ab-error').style.display='none';
  } else if(form==='user-mgmt') {
    document.getElementById('usr-name').value='';
    document.getElementById('usr-error').style.display='none';
  }
}

// Keyboard login support
document.addEventListener('keydown', function(e) {
  if(e.key==='Enter') {
    const loginPage = document.getElementById('page-login');
    if(loginPage.classList.contains('active')) doLogin();
  }
});