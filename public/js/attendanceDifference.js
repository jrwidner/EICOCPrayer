document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');
    const memberSelect = document.getElementById('member-select');
    const clearSelectionButton = document.getElementById('clear-selection');
    const hideVisitorsCheckbox = document.getElementById('hide-visitors-checkbox');
    const infoBlock = document.getElementById('info-block'); // Add this line

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

            // Calculate total weeks in the data set
            const totalWeeks = [...new Set(data.map(record => new Date(record.Date).toLocaleDateString()))].length;

            // Calculate total number of possible Worship services
            const totalPossibleWorshipServices = totalWeeks;

            // Function to calculate attendance percentages and totals
            const calculateAttendance = (records, name) => {
                const totalRecords = records.filter(record => `${record.LastName}, ${record.FirstName}` === name).length;
                const worshipCount = records.filter(record => `${record.LastName}, ${record.FirstName}` === name && record.WorshipService).length;
                const bibleClassCount = records.filter(record => `${record.LastName}, ${record.FirstName}` === name && record.BibleClass).length;
                const worshipPercentage = totalWeeks ? (worshipCount / totalWeeks * 100).toFixed(2) : 0;
                const bibleClassPercentage = worshipCount ? (bibleClassCount / worshipCount * 100).toFixed(2) : 0;
                return { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount, totalRecords };
            };

            // Function to check if a member is a visitor
            const isVisitor = (records, name) => {
                const memberRecords = records.filter(record => `${record.LastName}, ${record.FirstName}` === name);
                const worshipCount = memberRecords.filter(record => record.WorshipService).length;
                // Check if there are 3 weeks of attendance in the most recent 4-week stretch
                const recentRecords = memberRecords.slice(-4);
                const recentWorshipCount = recentRecords.filter(record => record.WorshipService).length;
                return (worshipCount >= 0 && worshipCount <= 4 && recentWorshipCount < 3);
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
                        <th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Class</th>
                    `;
                });
                attendanceTable.appendChild(dateHeaderRow);
                attendanceTable.appendChild(serviceHeaderRow);

                // Add total attendance counts below each date
                const totalAttendanceRow = document.createElement('tr');
                totalAttendanceRow.innerHTML = `<td></td>`; // Only one initial empty cell
                uniqueDates.forEach(date => {
                    const totalWorshipAttendees = data.filter(record => new Date(record.Date).toLocaleDateString() === date && record.WorshipService).length;
                    const totalBibleClassAttendees = data.filter(record => new Date(record.Date).toLocaleDateString() === date && record.BibleClass).length;
                    totalAttendanceRow.innerHTML += `
                        <td class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${totalWorshipAttendees}</td>
                        <td class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${totalBibleClassAttendees}</td>
                    `;
                });
                attendanceTable.appendChild(totalAttendanceRow);

                uniqueNames.forEach((name, index) => {
                    const { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount, totalRecords } = calculateAttendance(data, name);

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

                    // Skip visitors if the hide visitors checkbox is checked
                    if (hideVisitorsCheckbox.checked && isVisitor(data, name)) {
                        return;
                    }

                    if (selectedMembers.length === 0 || selectedMembers.includes(name)) {
                        const nameRow = document.createElement('tr');
                        nameRow.classList.add(index % 2 === 0 ? 'row-bg-1' : 'row-bg-2');
                        nameRow.innerHTML = `<td class="nowrap"><span class="name">${name}</span><br>${worshipCount} Worships <span style="color:${worshipColor}">${worshipPercentage}%</span> - ${bibleClassCount} Bible Classes <span style="color:${bibleClassColor}">${bibleClassPercentage}%</span></td>`;
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

            // Event listener for hide visitors checkbox
            hideVisitorsCheckbox.addEventListener('change', () => {
                const selectedOptions = Array.from(memberSelect.selectedOptions).map(option => option.value);
                renderTable(selectedOptions);
            });

            // Add information block content
            infoBlock.innerHTML = `
                <p>Total Number of Possible Worship Services: ${totalPossibleWorshipServices}</p>
                <p><strong>Legend:</strong></p>
                <p><span class="checkmark">✓</span> Attended <span class="cross">✗</span> Not Attended <span class="no-data">✗</span> No Data</p>
            `;
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });
});
