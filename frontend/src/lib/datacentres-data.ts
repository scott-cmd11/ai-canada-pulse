export type DataCentreType = 'hyperscaler' | 'colo' | 'telco' | 'government' | 'hpc'

export interface DataCentre {
  name: string
  operator: string
  city: string
  province: string
  lat: number
  lng: number
  type: DataCentreType
}

export const DATA_CENTRES: DataCentre[] = [
  // ── Cloud / Hyperscaler regions ──────────────────────────────────────────
  { name: 'AWS Canada Central (ca-central-1)', operator: 'Amazon Web Services', city: 'Montreal', province: 'QC', lat: 45.5017, lng: -73.5673, type: 'hyperscaler' },
  { name: 'AWS Canada West (ca-west-1)', operator: 'Amazon Web Services', city: 'Calgary', province: 'AB', lat: 51.0447, lng: -114.0719, type: 'hyperscaler' },
  { name: 'Microsoft Azure Canada Central', operator: 'Microsoft Azure', city: 'Toronto', province: 'ON', lat: 43.6629, lng: -79.3957, type: 'hyperscaler' },
  { name: 'Microsoft Azure Canada East', operator: 'Microsoft Azure', city: 'Quebec City', province: 'QC', lat: 46.8139, lng: -71.2080, type: 'hyperscaler' },
  { name: 'Google Cloud northamerica-northeast1', operator: 'Google Cloud', city: 'Montreal', province: 'QC', lat: 45.4833, lng: -73.6200, type: 'hyperscaler' },
  { name: 'Google Cloud northamerica-northeast2', operator: 'Google Cloud', city: 'Toronto', province: 'ON', lat: 43.7200, lng: -79.3400, type: 'hyperscaler' },
  { name: 'Google Cloud Beauharnois (planned)', operator: 'Google Cloud', city: 'Beauharnois', province: 'QC', lat: 45.3200, lng: -73.8700, type: 'hyperscaler' },
  { name: 'Oracle Cloud ca-toronto-1', operator: 'Oracle Cloud', city: 'Toronto', province: 'ON', lat: 43.6800, lng: -79.4100, type: 'hyperscaler' },
  { name: 'Oracle Cloud ca-montreal-1', operator: 'Oracle Cloud', city: 'Montreal', province: 'QC', lat: 45.5200, lng: -73.5900, type: 'hyperscaler' },
  { name: 'TELUS Sovereign AI Factory', operator: 'TELUS / NVIDIA', city: 'Rimouski', province: 'QC', lat: 48.4758, lng: -68.5219, type: 'hyperscaler' },
  { name: 'CoreWeave Cambridge', operator: 'CoreWeave', city: 'Cambridge', province: 'ON', lat: 43.3601, lng: -80.3124, type: 'hyperscaler' },
  { name: 'Yondr TOR1', operator: 'Yondr Group', city: 'Toronto', province: 'ON', lat: 43.6700, lng: -79.3800, type: 'hyperscaler' },
  { name: 'Compass Datacenters YYZ2', operator: 'Compass Datacenters', city: 'Toronto (Etobicoke)', province: 'ON', lat: 43.6500, lng: -79.5300, type: 'hyperscaler' },
  { name: 'Compass Datacenters ROOT', operator: 'Compass Datacenters', city: 'Montreal', province: 'QC', lat: 45.5250, lng: -73.6100, type: 'colo' },
  { name: 'QScale Q01 Campus', operator: 'QScale', city: 'Lévis', province: 'QC', lat: 46.7212, lng: -71.2282, type: 'hyperscaler' },
  { name: 'Beacon Chestermere AI Hub (planned)', operator: 'Beacon AI Centers', city: 'Chestermere', province: 'AB', lat: 51.0494, lng: -113.8196, type: 'hyperscaler' },
  { name: 'Beacon Foothills AI Hub (planned)', operator: 'Beacon AI Centers', city: 'High River', province: 'AB', lat: 50.5805, lng: -113.8747, type: 'hyperscaler' },
  { name: 'Beacon Parkland AI Hub (planned)', operator: 'Beacon AI Centers', city: 'Parkland County', province: 'AB', lat: 53.5350, lng: -114.0050, type: 'hyperscaler' },

  // ── Equinix ──────────────────────────────────────────────────────────────
  { name: 'Equinix TR1', operator: 'Equinix', city: 'Toronto', province: 'ON', lat: 43.6380, lng: -79.4300, type: 'colo' },
  { name: 'Equinix TR4', operator: 'Equinix', city: 'Toronto', province: 'ON', lat: 43.6450, lng: -79.4200, type: 'colo' },
  { name: 'Equinix TR5', operator: 'Equinix', city: 'Markham', province: 'ON', lat: 43.8509, lng: -79.3304, type: 'colo' },
  { name: 'Equinix TR6', operator: 'Equinix', city: 'Toronto', province: 'ON', lat: 43.6550, lng: -79.4100, type: 'colo' },
  { name: 'Equinix TR7', operator: 'Equinix', city: 'Toronto', province: 'ON', lat: 43.6600, lng: -79.4000, type: 'colo' },
  { name: 'Equinix CL1', operator: 'Equinix', city: 'Calgary', province: 'AB', lat: 51.0486, lng: -114.0708, type: 'colo' },
  { name: 'Equinix CL2', operator: 'Equinix', city: 'Calgary', province: 'AB', lat: 51.0560, lng: -114.0600, type: 'colo' },
  { name: 'Equinix CL3', operator: 'Equinix', city: 'Calgary', province: 'AB', lat: 50.9896, lng: -113.9725, type: 'colo' },
  { name: 'Equinix VA1', operator: 'Equinix', city: 'Burnaby', province: 'BC', lat: 49.2650, lng: -122.9945, type: 'colo' },
  { name: 'Equinix MT1', operator: 'Equinix', city: 'Montreal', province: 'QC', lat: 45.4950, lng: -73.5800, type: 'colo' },
  { name: 'Equinix MT2', operator: 'Equinix', city: 'Vaudreuil-Dorion', province: 'QC', lat: 45.3975, lng: -74.0289, type: 'colo' },
  { name: 'Equinix OT1', operator: 'Equinix', city: 'Ottawa', province: 'ON', lat: 45.4215, lng: -75.6972, type: 'colo' },
  { name: 'Equinix SJ1', operator: 'Equinix', city: 'Saint John', province: 'NB', lat: 45.2769, lng: -66.0692, type: 'colo' },
  { name: 'Equinix WI1', operator: 'Equinix', city: 'Winnipeg', province: 'MB', lat: 49.8711, lng: -97.1454, type: 'colo' },
  { name: 'Equinix KA1', operator: 'Equinix', city: 'Kamloops', province: 'BC', lat: 50.6745, lng: -120.3273, type: 'colo' },

  // ── Digital Realty ───────────────────────────────────────────────────────
  { name: 'Digital Realty YYZ11', operator: 'Digital Realty', city: 'Toronto', province: 'ON', lat: 43.6300, lng: -79.4050, type: 'colo' },
  { name: 'Digital Realty Markham (MKM)', operator: 'Digital Realty', city: 'Markham', province: 'ON', lat: 43.8600, lng: -79.3400, type: 'colo' },

  // ── Cologix ──────────────────────────────────────────────────────────────
  { name: 'Cologix TOR1', operator: 'Cologix', city: 'Toronto', province: 'ON', lat: 43.6700, lng: -79.4450, type: 'colo' },
  { name: 'Cologix TOR2', operator: 'Cologix', city: 'Toronto', province: 'ON', lat: 43.6750, lng: -79.4350, type: 'colo' },
  { name: 'Cologix TOR3', operator: 'Cologix', city: 'Toronto', province: 'ON', lat: 43.6800, lng: -79.4250, type: 'colo' },
  { name: 'Cologix TOR4', operator: 'Cologix', city: 'Toronto', province: 'ON', lat: 43.6850, lng: -79.4150, type: 'colo' },
  { name: 'Cologix MON1', operator: 'Cologix', city: 'Montreal', province: 'QC', lat: 45.5100, lng: -73.5600, type: 'colo' },
  { name: 'Cologix MON2', operator: 'Cologix', city: 'Montreal', province: 'QC', lat: 45.5150, lng: -73.5700, type: 'colo' },
  { name: 'Cologix MON3', operator: 'Cologix', city: 'Montreal', province: 'QC', lat: 45.5050, lng: -73.5500, type: 'colo' },
  { name: 'Cologix VAN1', operator: 'Cologix', city: 'Vancouver', province: 'BC', lat: 49.2827, lng: -123.1207, type: 'colo' },
  { name: 'Cologix VAN2', operator: 'Cologix', city: 'Vancouver', province: 'BC', lat: 49.2700, lng: -123.1100, type: 'colo' },
  { name: 'Cologix CAL1 (DataHiveOne)', operator: 'Cologix', city: 'Calgary', province: 'AB', lat: 51.0350, lng: -114.0850, type: 'colo' },

  // ── eStruxture ───────────────────────────────────────────────────────────
  { name: 'eStruxture MTL-1', operator: 'eStruxture', city: 'Montreal', province: 'QC', lat: 45.5300, lng: -73.6200, type: 'colo' },
  { name: 'eStruxture MTL-2', operator: 'eStruxture', city: 'Montreal', province: 'QC', lat: 45.5350, lng: -73.6350, type: 'colo' },
  { name: 'eStruxture TOR-5 (Barrie)', operator: 'eStruxture', city: 'Barrie', province: 'ON', lat: 44.3900, lng: -79.7100, type: 'colo' },
  { name: 'eStruxture CAL-1', operator: 'eStruxture', city: 'Calgary', province: 'AB', lat: 51.0250, lng: -114.0550, type: 'colo' },
  { name: 'eStruxture CAL-2', operator: 'eStruxture', city: 'Calgary', province: 'AB', lat: 51.0300, lng: -114.0650, type: 'colo' },
  { name: 'eStruxture VAN-1', operator: 'eStruxture', city: 'Vancouver', province: 'BC', lat: 49.2800, lng: -123.1150, type: 'colo' },

  // ── Vantage Data Centers ─────────────────────────────────────────────────
  { name: 'Vantage QC1 (Saint-Laurent)', operator: 'Vantage Data Centers', city: 'Montreal', province: 'QC', lat: 45.5100, lng: -73.7100, type: 'colo' },
  { name: 'Vantage QC4 (Pointe-Claire)', operator: 'Vantage Data Centers', city: 'Pointe-Claire', province: 'QC', lat: 45.4600, lng: -73.8200, type: 'colo' },
  { name: 'Vantage QC6 (Baie-D\'Urfé)', operator: 'Vantage Data Centers', city: 'Baie-D\'Urfé', province: 'QC', lat: 45.4150, lng: -73.9100, type: 'colo' },

  // ── IBM ──────────────────────────────────────────────────────────────────
  { name: 'IBM CLDC (Canadian Leadership DC)', operator: 'IBM', city: 'Barrie', province: 'ON', lat: 44.3894, lng: -79.6903, type: 'colo' },
  { name: 'IBM Cloud Toronto', operator: 'IBM', city: 'Markham', province: 'ON', lat: 43.8400, lng: -79.3200, type: 'colo' },
  { name: 'IBM Cloud Montreal', operator: 'IBM', city: 'Drummondville', province: 'QC', lat: 45.8833, lng: -72.7167, type: 'colo' },

  // ── Telehouse ────────────────────────────────────────────────────────────
  { name: 'Telehouse 151 Front St W', operator: 'Telehouse Canada', city: 'Toronto', province: 'ON', lat: 43.6466, lng: -79.3893, type: 'colo' },
  { name: 'Telehouse 250 Front St W', operator: 'Telehouse Canada', city: 'Toronto', province: 'ON', lat: 43.6471, lng: -79.3940, type: 'colo' },
  { name: 'Telehouse 905 King St W', operator: 'Telehouse Canada', city: 'Toronto', province: 'ON', lat: 43.6442, lng: -79.4200, type: 'colo' },

  // ── EdgeConneX ───────────────────────────────────────────────────────────
  { name: 'EdgeConneX TOR01', operator: 'EdgeConneX', city: 'Toronto', province: 'ON', lat: 43.7500, lng: -79.4100, type: 'colo' },

  // ── Urbacon ──────────────────────────────────────────────────────────────
  { name: 'Urbacon DC1 Richmond Hill', operator: 'Urbacon', city: 'Richmond Hill', province: 'ON', lat: 43.8750, lng: -79.4400, type: 'colo' },
  { name: 'Urbacon DC4 Richmond Hill', operator: 'Urbacon', city: 'Richmond Hill', province: 'ON', lat: 43.8800, lng: -79.4350, type: 'colo' },
  { name: 'Urbacon Sault Ste. Marie', operator: 'Urbacon', city: 'Sault Ste. Marie', province: 'ON', lat: 46.5136, lng: -84.3358, type: 'colo' },

  // ── 365 Data Centers ─────────────────────────────────────────────────────
  { name: '365 Data Centers CA1', operator: '365 Data Centers', city: 'Toronto', province: 'ON', lat: 43.6550, lng: -79.3900, type: 'colo' },

  // ── OVHcloud ─────────────────────────────────────────────────────────────
  { name: 'OVHcloud BHS (Beauharnois)', operator: 'OVHcloud', city: 'Beauharnois', province: 'QC', lat: 45.3167, lng: -73.8667, type: 'hpc' },

  // ── Telco ────────────────────────────────────────────────────────────────
  { name: 'TELUS Laird Drive', operator: 'TELUS', city: 'Toronto', province: 'ON', lat: 43.7315, lng: -79.4172, type: 'telco' },
  { name: 'TELUS Calgary DC', operator: 'TELUS', city: 'Calgary', province: 'AB', lat: 51.0550, lng: -114.0820, type: 'telco' },
  { name: 'TELUS Kamloops DC', operator: 'TELUS', city: 'Kamloops', province: 'BC', lat: 50.6745, lng: -120.3500, type: 'telco' },
  { name: 'Bell Canada DC (Kamloops)', operator: 'Bell Canada', city: 'Kamloops', province: 'BC', lat: 50.6600, lng: -120.3150, type: 'telco' },
  { name: 'Bell Canada DC (Merritt)', operator: 'Bell Canada', city: 'Merritt', province: 'BC', lat: 50.1079, lng: -120.7881, type: 'telco' },
  { name: 'Rogers Carrier Hotel', operator: 'Rogers', city: 'Toronto', province: 'ON', lat: 43.6480, lng: -79.3850, type: 'telco' },
  { name: 'Rogers Vancouver DC', operator: 'Rogers', city: 'Vancouver', province: 'BC', lat: 49.2550, lng: -123.1050, type: 'telco' },
  { name: 'Shaw Communications DC', operator: 'Shaw / Rogers', city: 'Calgary', province: 'AB', lat: 51.0650, lng: -114.1100, type: 'telco' },
  { name: 'Zayo Ottawa Carrier Hotel', operator: 'Zayo', city: 'Ottawa', province: 'ON', lat: 45.4180, lng: -75.7020, type: 'colo' },

  // ── HPC / Mining / AI Compute ────────────────────────────────────────────
  { name: 'Hut 8 Iroquois Falls', operator: 'Hut 8', city: 'Iroquois Falls', province: 'ON', lat: 48.7657, lng: -80.6840, type: 'hpc' },
  { name: 'Hut 8 Medicine Hat', operator: 'Hut 8', city: 'Medicine Hat', province: 'AB', lat: 50.0416, lng: -110.6764, type: 'hpc' },
  { name: 'Hut 8 Kingston', operator: 'Hut 8', city: 'Kingston', province: 'ON', lat: 44.2312, lng: -76.4860, type: 'hpc' },
  { name: 'Hut 8 Kapuskasing', operator: 'Hut 8', city: 'Kapuskasing', province: 'ON', lat: 49.4183, lng: -82.4370, type: 'hpc' },
  { name: 'Hut 8 North Bay', operator: 'Hut 8', city: 'North Bay', province: 'ON', lat: 46.3091, lng: -79.4608, type: 'hpc' },
  { name: 'IREN Prince George', operator: 'IREN (Iris Energy)', city: 'Prince George', province: 'BC', lat: 53.9171, lng: -122.7497, type: 'hpc' },
  { name: 'IREN Mackenzie', operator: 'IREN (Iris Energy)', city: 'Mackenzie', province: 'BC', lat: 55.3427, lng: -123.1135, type: 'hpc' },
  { name: 'IREN Canal Flats', operator: 'IREN (Iris Energy)', city: 'Canal Flats', province: 'BC', lat: 50.1521, lng: -115.8124, type: 'hpc' },
  { name: 'HIVE Blockchain Grand Falls', operator: 'HIVE Blockchain', city: 'Grand Falls-Windsor', province: 'NL', lat: 48.9350, lng: -55.6640, type: 'hpc' },
  { name: 'DMG Blockchain Christina Lake', operator: 'DMG Blockchain', city: 'Christina Lake', province: 'BC', lat: 49.0688, lng: -118.1852, type: 'hpc' },
  { name: 'Bit Digital / Enovum MTL1', operator: 'Bit Digital / Enovum', city: 'Montreal', province: 'QC', lat: 45.5050, lng: -73.6800, type: 'hpc' },
  { name: 'Bit Digital / Enovum MTL2', operator: 'Bit Digital / Enovum', city: 'Pointe-Claire', province: 'QC', lat: 45.4650, lng: -73.8100, type: 'hpc' },
  { name: 'Gryphon Digital Mining (planned)', operator: 'Gryphon Digital', city: 'Pincher Creek', province: 'AB', lat: 49.5224, lng: -113.9382, type: 'hpc' },
  { name: 'Whipcord Edge Lethbridge', operator: 'Whipcord Edge', city: 'Lethbridge', province: 'AB', lat: 49.6942, lng: -112.8328, type: 'hpc' },
  { name: 'Northern Data / Ardent Les Escoumins', operator: 'Northern Data (Ardent)', city: 'Les Escoumins', province: 'QC', lat: 48.3588, lng: -69.4073, type: 'hpc' },
]

export const TYPE_LABELS: Record<DataCentreType, string> = {
  hyperscaler: 'Cloud / Hyperscaler',
  colo: 'Colocation',
  telco: 'Telecom',
  hpc: 'HPC / Mining / AI Compute',
  government: 'Government',
}

export const TYPE_COLOURS: Record<DataCentreType, string> = {
  hyperscaler: '#f97316',  // orange
  colo: '#3b82f6',         // blue
  telco: '#8b5cf6',        // purple
  hpc: '#14b8a6',          // teal
  government: '#22c55e',   // green
}
