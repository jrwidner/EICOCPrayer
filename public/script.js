document.getElementById('prayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    await fetch('/api/AddOrUpdatePrayerRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    loadRequests();
});

async function loadRequests() {
    const response = await fetch('/api/GetPrayerRequests');
    const requests = await response.json();
    const requestsDiv = document.getElementById('requests');
    requestsDiv.innerHTML = '';

    requests.forEach(request => {
        const requestDiv = document.createElement('div');
        requestDiv.classList.add('request-item');
        requestDiv.innerHTML = `
            <p><strong>Date of Request:</strong> ${request.dateOfRequest}</p>
            <p><strong>Name:</strong> ${request.name}</p>
            <p><strong>Type of Prayer Request:</strong> ${request.type}</p>
            <p><strong>Description:</strong> ${request.description}</p>
            <p><strong>Date of Update:</strong> ${request.dateOfUpdate}</p>
            <p><strong>Update:</strong> ${request.update}</p>
            <button onclick="editRequest('${request.rowKey}')">Edit</button>
            <div id="editForm-${request.rowKey}" class="hidden">
                <form onsubmit="submitEdit(event, '${request.rowKey}')">
                    <div class="form-group">
                        <label for="update-${request.rowKey}">Update (if any):</label>
                        <textarea id="update-${request.rowKey}" name="update">${request.update}</textarea>
                    </div>
                    <button type="submit">Save</button>
                </form>
            </div>
        `;
        requestsDiv.appendChild(requestDiv);
    });
}

function editRequest(id) {
    document.getElementById(`editForm-${id}`).classList.toggle('hidden');
}

async function submitEdit(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    data.id = id;

    await fetch('/api/AddOrUpdatePrayerRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    loadRequests();
}

document.getElementById('exportButton').addEventListener('click', async () => {
    const response = await fetch('/api/ExportPrayerRequests', {
        method: 'POST',
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prayer_requests.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
});

loadRequests();
