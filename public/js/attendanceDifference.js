document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');
    const memberSelect = document.getElementById('member-select');
    const clearSelectionButton = document.getElementById('clear-selection');
    const hideVisitorsToggle = document.createElement('button');
    hideVisitorsToggle.id = 'hide-visitors';
    hideVisitorsToggle.textContent = 'Hide Visitors';
    hideVisitorsToggle.classList.add('toggle-button');

    // Add the hide visitors toggle to the selection container
    const selectionContainer = document.querySelector('.selection-container');
    selectionContainer.appendChild(hideVisitorsToggle);

    // Show spinner before fetching data
    spinner.style.display = 'block';

    // Fetch and display attendance data
    fetch('/api/attendance-difference')
        .then(response => response.json())
        .then(data => {
            // Hide spinner after data is fetched
            spinner.style.display = 'none';

            // Sort data by last name in ascending order
            data.sort((a, b) => a.LastName.localeCompare(b.LastName));

            // Populate member select options
            const uniqueNames = [...new Set(data.map(record => `${record.LastName}, ${record.FirstName}`))];
            uniqueNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                memberSelect.appendChild(option);
            });

            // Function to calculate attendance percentages and totals
            const calculateAttendance = (records, name, totalWeeks) => {
                const totalRecords = records.filter(record => `${record.LastName}, ${record.FirstName}` === name).length;
                const worshipCount = records.filter(record => `${record.LastName}, ${record.FirstName}` === name && record.WorshipService).length;
                const bibleClassCount = records.filter(record => `${record.LastName}, ${record.FirstName}` === name && record.BibleClass).length;
                const worshipPercentage = totalWeeks ? (worshipCount / totalWeeks * 100).toFixed(2) : 0;
                const bibleClassPercentage = totalWeeks ? (bibleClassCount / totalWeeks * 100).toFixed(2) : 0;
                return { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount, totalRecords };
            };

            // Function to render the table based on selected members
            const renderTable = (selectedMembers) => {
                attendanceTable.innerHTML = '';

                let currentDate = '';
                let altBg = true;

                // Create the header rows
                const dateHeaderRow = document.createElement('tr');
                const serviceHeaderRow = document.createElement('tr');
                dateHeaderRow.innerHTML = `<th>Name</th>`;
                serviceHeaderRow.innerHTML = `<th></th>`;

                // Sort unique dates from newest to oldest
                const uniqueDates = [...new Set(data.map(record => new Date(record.Date).toLocaleDateString()))];
                uniqueDates.sort((a, b) => new Date(b) - new Date(a));

                uniqueDates.forEach(date => {
                    altBg = !altBg;
                    dateHeaderRow.innerHTML += `<th colspan="2" class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${date}</th>`;
                    serviceHeaderRow.innerHTML += `
                        <th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Worship</th>
                        <th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Bible Class</th>
                    `;
                });

                attendanceTable.appendChild(dateHeaderRow);
                attendanceTable.appendChild(serviceHeaderRow);

                uniqueNames.forEach((name, index) => {
                    const { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount, totalRecords } = calculateAttendance(data, name, uniqueDates.length);

                    // Determine color coding for worship attendance
                    let worshipColor = 'red';
                    if (worshipPercentage >= 75) {
                        worshipColor = 'green';
                    } else if (worshipPercentage >= 50) {
                        worshipColor = 'orange';
                    }

                    // Determine color coding for Bible class attendance
                    let bibleClassColor = 'red';
                    if (bibleClassPercentage >= 75) {
                        bibleClassColor = 'green';
                    } else if (bibleClassPercentage >= 50) {
                        bibleClassColor = 'orange';
                    }

                    // Check if the member is a visitor
                    const isVisitor = (worshipCount >= 0 && worshipCount <= 3 && totalRecords >= 6);

                    // Skip visitors if the hide visitors toggle is active
                    if (hideVisitorsToggle.classList.contains('active') && isVisitor) {
                        return;
                    }

                    if (selectedMembers.length === 0 || selectedMembers.includes(name)) {
                        const nameRow = document.createElement('tr');
                        nameRow.classList.add(index % 2 === 0 ? 'row-bg-1' : 'row-bg-2');
                        nameRow.innerHTML = `<td class="nowrap">${name}<br>(Worship: <span style="color:${worshipColor}">${worshipPercentage}%</span> (${worshipCount}), Bible Class: <span style="color:${bibleClassColor}">${bibleClassPercentage}%</span> (${bibleClassCount}))</td>`;
                        uniqueDates.forEach(date => {
                            const record = data.find(record => 
                                `${record.LastName}, ${record.FirstName}` === name && 
                                new Date(record.Date).toLocaleDateString() === date
                            );
                            if (record) {
                                nameRow.innerHTML += `
                                    <td class="nowrap">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                                    <td class="nowrap">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                                `;
                            } else {
                                nameRow.innerHTML += `
                                    <td class="nowrap"><span class="no-data">✗</span></td>
                                    <td class="nowrap"><span class="no-data">✗</span></td>
                                `;
                            }
                        });
                        attendanceTable.appendChild(nameRow);
                    }
                });
            };

            // Initial render with all members
            renderTable([]);

            // Event listener for member selection change
            memberSelect.addEventListener('change', () => {
                const selectedOptions = Array.from(memberSelect.selectedOptions).map(option => option.value);
                renderTable(selectedOptions);
            });

            // Event listener for clear selection button
            clearSelectionButton.addEventListener('click', () => {
                memberSelect.selectedIndex = -1;
                renderTable([]);
            });

            // Event listener for hide visitors toggle
            hideVisitorsToggle.addEventListener('click', () => {
                hideVisitorsToggle.classList.toggle('active');
                hideVisitorsToggle.textContent = hideVisitorsToggle.classList.contains('active') ? 'Show Visitors' : 'Hide Visitors';
                const selectedOptions = Array.from(memberSelect.selectedOptions).map(option => option.value);
                renderTable(selectedOptions);
            });
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });
});
