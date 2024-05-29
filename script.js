let chart;

async function fetchPatientData() {
    try {
        const response = await axios.get('https://fedskillstest.coalitiontechnologies.workers.dev', {
            headers: {
                'Authorization': 'Basic Y29hbGl0aW9uOnNraWxscy10ZXN0'
            }
        });
        const patients = response.data;
        // console.log('all patients:', patients);
        // console.log('1 patients:', patients[3])       
        populatePatientList(patients);
        displayPatientDetails(patients[3]);
        diagnosisList(patients[3].diagnostic_list);

        
    } catch (error) {
        console.error('Error fetching patient data:', error);
    }
}

function populatePatientList(patients) {
    const patientList = document.getElementById('patient-list');
    const mobilePatientsList = document.getElementById('mobile-patient-list');

    // Clear any existing rows
    mobilePatientsList.innerHTML = '';
    patientList.innerHTML = '';
    
    patients.forEach((patient, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'cursor-pointer';

        if (index === 3){
            listItem.classList.add('clicked-bg')
        }

        listItem.innerHTML = `
            <div class="flex items-center justify-between py-3 px-3">
                <div class="flex items-center">
                    <div class="w-12 h-12 mr-3">
                        <img src="${patient.profile_picture}" alt="" class="rounded-full">
                    </div>
                    <div class="text-sm">
                        <h3 class="font-bold">${patient.name}</h3>
                        <p>${patient.gender}, ${patient.age}</p>
                    </div>
                </div>
                <div>
                    <img src="/public/images/more_horiz_FILL0_wght300_GRAD0_opsz24.svg" alt="3 dots">
                </div>
            </div>
        `;
        listItem.addEventListener('click', () => {
            //remove class from all items
            document.querySelectorAll('.cursor-pointer').forEach(item => item.classList.remove('clicked-bg'));

            // Add the selected class to the clicked item
            listItem.classList.add('clicked-bg');

            displayPatientDetails(patient);
            diagnosisList(patient.diagnostic_list);
        });
        patientList.appendChild(listItem);
        
        const mobileListItem = listItem.cloneNode(true);
        mobileListItem.addEventListener('click', () => {
            displayPatientDetails(patient);
            diagnosisList(patient.diagnostic_list);
            // Hide mobile menu after selection 
            document.getElementById('mobile-menu').classList.add('hidden');
            document.getElementById('hamburger-icon').classList.remove('hidden');
            document.getElementById('cancel-icon').classList.add('hidden');
        });
        mobilePatientsList.appendChild(mobileListItem);
    });
}

function diagnosisList(diagnosticList) {
    const tableBody = document.getElementById('problem-list');
    tableBody.innerHTML = ''; // Clear any existing rows

    diagnosticList.forEach(diagnosis => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-2 px-2 md:px-4">${diagnosis.name}</td>
            <td class="py-2 px-2 md:px-4">${diagnosis.description}</td>
            <td class="py-2 px-2 md:px-4">${diagnosis.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

function displayPatientDetails(patient) {
    document.getElementById('patient-name').innerText = patient.name;
    document.getElementById('patient-dob').innerText = patient.date_of_birth;
    document.getElementById('patient-gender').innerText = patient.gender;
    document.getElementById('patient-contact').innerText = patient.phone_number;
    document.getElementById('patient-emergency').innerText = patient.emergency_contact;
    document.getElementById('patient-insurance').innerText = patient.insurance_type;
    document.getElementById('profile-picture').src = patient.profile_picture;

    const diagnosisHistory = patient.diagnosis_history;
    const latest6Months = diagnosisHistory.slice(0, 6).reverse(); 

    const latestDiagnosis = diagnosisHistory[diagnosisHistory.length - 1];
    updateVitals(latestDiagnosis);

    renderRespiratoryRateChart(latest6Months, diagnosisHistory)
}

function renderRespiratoryRateChart(latest6Months, diagnosisHistory) {
    const ctx = document.getElementById('chart').getContext('2d');

    const labels = latest6Months.map(d => formatMonthYear(d.month, d.year));
    const systolicData = latest6Months.map(d => d.blood_pressure.systolic.value);
    const diastolicData = latest6Months.map(d => d.blood_pressure.diastolic.value);

    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels:  labels,
            datasets: [{
                label: 'Systolic',
                data: systolicData,
                fill: false,
                borderColor: '#C26EB4',
                tension: 0.4
            },
            {
                label: 'Diastolic',
                data: diastolicData,
                fill: false,
                borderColor: '#7E6CAB',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const data = latest6Months[index];
                    updateVitals(data);
                }
            }
        },
        
    });

    document.getElementById('data-range').addEventListener('change', (e) => {
        const selectedRange = e.target.value;
        let filteredData;
        if (selectedRange === '1-year') {
            filteredData = diagnosisHistory.slice(0, 12).reverse(); // Get the previous 1 year
        } else {
            filteredData = latest6Months; // Get the previous 6 months
        }
        updateChartData(filteredData);
    });
}

function formatMonthYear(month, year) {
    const date = new Date(`${year}-${month}-01`);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function updateVitals(data) {
    document.getElementById('systolic-value').innerText = data.blood_pressure.systolic.value;
    document.getElementById('diastolic-value').innerText = data.blood_pressure.diastolic.value;
    document.getElementById('systolic-level').innerText = data.blood_pressure.systolic.levels;
    document.getElementById('diastolic-level').innerText = data.blood_pressure.diastolic.levels;
    
    document.getElementById('respiratory-rate').innerText = `${data.respiratory_rate.value} bpm`;
    document.getElementById('temperature').innerText = `${data.temperature.value}°F`;
    document.getElementById('heart-rate').innerText = `${data.heart_rate.value} bpm`;

    document.getElementById('respiratory-levels').innerText = data.respiratory_rate.levels;
    document.getElementById('temperature-levels').innerText = data.temperature.levels;
    document.getElementById('heart-rate-levels').innerText = data.heart_rate.levels;
}

function updateChartData(filteredData) {
    const labels = filteredData.map(d => `${d.month}, ${d.year}`);
    const systolicData = filteredData.map(d => d.blood_pressure.systolic.value);
    const diastolicData = filteredData.map(d => d.blood_pressure.diastolic.value);

    chart.data.labels = labels;
    chart.data.datasets[0].data = systolicData;
    chart.data.datasets[1].data = diastolicData;
    chart.update();
}

fetchPatientData();