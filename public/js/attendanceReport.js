document.addEventListener('DOMContentLoaded', () => {
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');

    if (!attendanceTable) {
        console.error('Attendance table element is missing in the DOM.');
        return;
    }

    async function fetchReport() {
        try {
            const response = await fetch('/missed-last-four-sundays');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            attendanceTable.innerHTML = ''; // Clear existing data
            data.sort((a, b) => a.LastName.localeCompare(b.LastName));
            data.forEach(member => {
                const row = document.createElement('tr');
                const lastNameCell = document.createElement('td');
                lastNameCell.textContent = member.LastName;
                const firstNameCell = document.createElement('td');
                firstNameCell.textContent = member.FirstName;
                row.appendChild(lastNameCell);
                row.appendChild(firstNameCell);
                attendanceTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    }

    // Fetch the report when the page loads
    fetchReport();
});