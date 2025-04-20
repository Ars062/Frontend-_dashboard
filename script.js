// Global variables to store the data
let evData = [];
let filteredData = [];

// DOM elements
const yearFilter = document.getElementById('year-filter');
const makeFilter = document.getElementById('make-filter');
const typeFilter = document.getElementById('type-filter');
const totalEvsElement = document.getElementById('total-evs');
const topMakeElement = document.getElementById('top-make');
const avgRangeElement = document.getElementById('avg-range');
const topCountyElement = document.getElementById('top-county');

// Chart instances
let evsByYearChart;
let topMakesChart;
let evsByCountyChart;
let evTypesChart;
let rangeDistributionChart;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Set up event listeners for filters
    yearFilter.addEventListener('change', updateDashboard);
    makeFilter.addEventListener('change', updateDashboard);
    typeFilter.addEventListener('change', updateDashboard);
});

// Load and parse the CSV data
function loadData() {
    Papa.parse('./data/Electric_Vehicle_Population_Data.csv', {
        download: true,
        header: true,
        complete: function(results) {
            // Clean and process the data
            evData = results.data.map(item => {
                // Clean up the electric range (some are empty or 0)
                let range = parseInt(item['Electric Range']) || 0;
                
                // Extract the EV type (BEV or PHEV)
                let evType = item['Electric Vehicle Type'].includes('Battery') ? 'BEV' : 'PHEV';
                
                return {
                    vin: item['VIN (1-10)'],
                    county: item['County'],
                    city: item['City'],
                    state: item['State'],
                    postalCode: item['Postal Code'],
                    modelYear: parseInt(item['Model Year']),
                    make: item['Make'],
                    model: item['Model'],
                    evType: evType,
                    cafvEligibility: item['Clean Alternative Fuel Vehicle (CAFV) Eligibility'],
                    electricRange: range,
                    baseMsrp: parseInt(item['Base MSRP']) || 0,
                    legislativeDistrict: item['Legislative District'],
                    dolVehicleId: item['DOL Vehicle ID'],
                    vehicleLocation: item['Vehicle Location'],
                    electricUtility: item['Electric Utility'],
                    censusTract: item['2020 Census Tract']
                };
            }).filter(item => item.modelYear); // Filter out any invalid rows
            
            // Initialize filters
            initializeFilters();
            
            // Set initial filtered data
            filteredData = [...evData];
            
            // Update the dashboard
            updateDashboard();
        },
        error: function(error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please check console for details.');
        }
    });
}

// Initialize filter dropdowns with options from the data
function initializeFilters() {
    // Get unique years, makes, and types
    const years = [...new Set(evData.map(item => item.modelYear))].sort((a, b) => b - a);
    const makes = [...new Set(evData.map(item => item.make))].sort();
    
    // Populate year filter
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    
    // Populate make filter
    makes.forEach(make => {
        const option = document.createElement('option');
        option.value = make;
        option.textContent = make;
        makeFilter.appendChild(option);
    });
}

// Apply filters and update the dashboard
function updateDashboard() {
    // Get filter values
    const selectedYear = yearFilter.value;
    const selectedMake = makeFilter.value;
    const selectedType = typeFilter.value;
    
    // Filter the data
    filteredData = evData.filter(item => {
        return (selectedYear === 'all' || item.modelYear == selectedYear) &&
               (selectedMake === 'all' || item.make === selectedMake) &&
               (selectedType === 'all' || item.evType === selectedType);
    });
    
    // Update metrics
    updateMetrics();
    
    // Update charts
    updateCharts();
}

// Update the metric cards
function updateMetrics() {
    // Total EVs
    totalEvsElement.textContent = filteredData.length.toLocaleString();
    
    // Top make
    const makeCounts = {};
    filteredData.forEach(item => {
        makeCounts[item.make] = (makeCounts[item.make] || 0) + 1;
    });
    const topMake = Object.entries(makeCounts).sort((a, b) => b[1] - a[1])[0];
    topMakeElement.textContent = topMake ? `${topMake[0]} (${topMake[1]})` : '-';
    
    // Average range (only for BEVs with range > 0)
    const bevWithRange = filteredData.filter(item => item.evType === 'BEV' && item.electricRange > 0);
    const avgRange = bevWithRange.length > 0 ? 
        Math.round(bevWithRange.reduce((sum, item) => sum + item.electricRange, 0) / bevWithRange.length) : 
        0;
    avgRangeElement.textContent = avgRange.toLocaleString() + ' mi';
    
    // Top county
    const countyCounts = {};
    filteredData.forEach(item => {
        if (item.county) {
            countyCounts[item.county] = (countyCounts[item.county] || 0) + 1;
        }
    });
    const topCounty = Object.entries(countyCounts).sort((a, b) => b[1] - a[1])[0];
    topCountyElement.textContent = topCounty ? `${topCounty[0]} (${topCounty[1]})` : '-';
}

// Update all charts
function updateCharts() {
    updateEvsByYearChart();
    updateTopMakesChart();
    updateEvsByCountyChart();
    updateEvTypesChart();
    updateRangeDistributionChart();
}

// Chart: EVs by Year
function updateEvsByYearChart() {
    // Group data by year
    const yearCounts = {};
    filteredData.forEach(item => {
        yearCounts[item.modelYear] = (yearCounts[item.modelYear] || 0) + 1;
    });
    
    // Sort years and get counts
    const years = Object.keys(yearCounts).sort();
    const counts = years.map(year => yearCounts[year]);
    
    // Get or create chart
    const ctx = document.getElementById('evs-by-year').getContext('2d');
    
    if (evsByYearChart) {
        evsByYearChart.data.labels = years;
        evsByYearChart.data.datasets[0].data = counts;
        evsByYearChart.update();
    } else {
        evsByYearChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Number of EVs',
                    data: counts,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'EVs by Model Year'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of EVs'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Model Year'
                        }
                    }
                }
            }
        });
    }
}

// Chart: Top Makes
function updateTopMakesChart() {
    // Count EVs by make
    const makeCounts = {};
    filteredData.forEach(item => {
        makeCounts[item.make] = (makeCounts[item.make] || 0) + 1;
    });
    
    // Sort by count and take top 10
    const sortedMakes = Object.entries(makeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const makes = sortedMakes.map(item => item[0]);
    const counts = sortedMakes.map(item => item[1]);
    
    // Get or create chart
    const ctx = document.getElementById('top-makes').getContext('2d');
    
    if (topMakesChart) {
        topMakesChart.data.labels = makes;
        topMakesChart.data.datasets[0].data = counts;
        topMakesChart.update();
    } else {
        topMakesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: makes,
                datasets: [{
                    label: 'Number of EVs',
                    data: counts,
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(155, 89, 182, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(241, 196, 15, 0.7)',
                        'rgba(230, 126, 34, 0.7)',
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(149, 165, 166, 0.7)',
                        'rgba(41, 128, 185, 0.7)',
                        'rgba(142, 68, 173, 0.7)',
                        'rgba(39, 174, 96, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top EV Makes'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

// Chart: EVs by County
function updateEvsByCountyChart() {
    // Count EVs by county
    const countyCounts = {};
    filteredData.forEach(item => {
        if (item.county) {
            countyCounts[item.county] = (countyCounts[item.county] || 0) + 1;
        }
    });
    
    // Sort by count and take top 15
    const sortedCounties = Object.entries(countyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    
    const counties = sortedCounties.map(item => item[0]);
    const counts = sortedCounties.map(item => item[1]);
    
    // Get or create chart
    const ctx = document.getElementById('evs-by-county').getContext('2d');
    
    if (evsByCountyChart) {
        evsByCountyChart.data.labels = counties;
        evsByCountyChart.data.datasets[0].data = counts;
        evsByCountyChart.update();
    } else {
        evsByCountyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: counties,
                datasets: [{
                    label: 'Number of EVs',
                    data: counts,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'EVs by County (Top 15)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of EVs'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'County'
                        }
                    }
                }
            }
        });
    }
}

// Chart: EV Types
function updateEvTypesChart() {
    // Count EVs by type
    const typeCounts = {
        'BEV': 0,
        'PHEV': 0
    };
    
    filteredData.forEach(item => {
        typeCounts[item.evType]++;
    });
    
    const types = Object.keys(typeCounts);
    const counts = types.map(type => typeCounts[type]);
    
    // Get or create chart
    const ctx = document.getElementById('ev-types').getContext('2d');
    
    if (evTypesChart) {
        evTypesChart.data.datasets[0].data = counts;
        evTypesChart.update();
    } else {
        evTypesChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: types,
                datasets: [{
                    label: 'Number of EVs',
                    data: counts,
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(155, 89, 182, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'EV Types Distribution'
                    }
                }
            }
        });
    }
}

// Chart: Range Distribution
function updateRangeDistributionChart() {
    // Get ranges for BEVs only
    const ranges = filteredData
        .filter(item => item.evType === 'BEV' && item.electricRange > 0)
        .map(item => item.electricRange);
    
    // Create bins for the histogram
    const binSize = 25;
    const maxRange = Math.max(...ranges, 400);
    const binCount = Math.ceil(maxRange / binSize);
    
    const bins = Array(binCount).fill(0);
    const labels = [];
    
    for (let i = 0; i < binCount; i++) {
        const min = i * binSize;
        const max = (i + 1) * binSize;
        labels.push(`${min}-${max} mi`);
        
        bins[i] = ranges.filter(range => range >= min && range < max).length;
    }
    
    // Get or create chart
    const ctx = document.getElementById('range-distribution').getContext('2d');
    
    if (rangeDistributionChart) {
        rangeDistributionChart.data.labels = labels;
        rangeDistributionChart.data.datasets[0].data = bins;
        rangeDistributionChart.update();
    } else {
        rangeDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of EVs',
                    data: bins,
                    backgroundColor: 'rgba(230, 126, 34, 0.7)',
                    borderColor: 'rgba(230, 126, 34, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Electric Range Distribution (BEVs only)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of EVs'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Range (miles)'
                        }
                    }
                }
            }
        });
    }
}