document.addEventListener('DOMContentLoaded', () => {
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');

    if (!attendanceTable) {
        console.error('Attendance table element is missing in the DOM.');
        return;
    }

    // Function to format dates as MM-DD-YYYY
    function formatDateToMMDDYYYY(dateString) {
        if (!dateString) return ''; // Handle empty or undefined date
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${month}-${day}-${year}`;
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

                // Last Name
                const lastNameCell = document.createElement('td');
                lastNameCell.textContent = member.LastName;

                // First Name
                const firstNameCell = document.createElement('td');
                firstNameCell.textContent = member.FirstName;

                // Last Seen Date (formatted)
                const lastSeenDateCell = document.createElement('td');
                lastSeenDateCell.textContent = formatDateToMMDDYYYY(member.LastSeenDate);

                // Append cells to the row
                row.appendChild(lastNameCell);
                row.appendChild(firstNameCell);
                row.appendChild(lastSeenDateCell);

                // Append the row to the table
                attendanceTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    }

    // Fetch the report when the page loads
    fetchReport();
});
