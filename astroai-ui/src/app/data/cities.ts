export interface CityData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  slug: string;
}

export const TOP_CITIES: CityData[] = [
  // India - Top 50 Cities
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata', slug: 'mumbai' },
  { city: 'Delhi', state: 'Delhi', country: 'India', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata', slug: 'delhi' },
  { city: 'Bangalore', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata', slug: 'bangalore' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867, timezone: 'Asia/Kolkata', slug: 'hyderabad' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata', slug: 'ahmedabad' },
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata', slug: 'chennai' },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata', slug: 'kolkata' },
  { city: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata', slug: 'pune' },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata', slug: 'jaipur' },
  { city: 'Surat', state: 'Gujarat', country: 'India', latitude: 21.1702, longitude: 72.8311, timezone: 'Asia/Kolkata', slug: 'surat' },
  { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata', slug: 'lucknow' },
  { city: 'Kanpur', state: 'Uttar Pradesh', country: 'India', latitude: 26.4499, longitude: 80.3319, timezone: 'Asia/Kolkata', slug: 'kanpur' },
  { city: 'Nagpur', state: 'Maharashtra', country: 'India', latitude: 21.1458, longitude: 79.0882, timezone: 'Asia/Kolkata', slug: 'nagpur' },
  { city: 'Indore', state: 'Madhya Pradesh', country: 'India', latitude: 22.7196, longitude: 75.8577, timezone: 'Asia/Kolkata', slug: 'indore' },
  { city: 'Thane', state: 'Maharashtra', country: 'India', latitude: 19.2183, longitude: 72.9781, timezone: 'Asia/Kolkata', slug: 'thane' },
  { city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', latitude: 23.2599, longitude: 77.4126, timezone: 'Asia/Kolkata', slug: 'bhopal' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', latitude: 17.6868, longitude: 83.2185, timezone: 'Asia/Kolkata', slug: 'visakhapatnam' },
  { city: 'Vadodara', state: 'Gujarat', country: 'India', latitude: 22.3072, longitude: 73.1812, timezone: 'Asia/Kolkata', slug: 'vadodara' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh', country: 'India', latitude: 28.6692, longitude: 77.4538, timezone: 'Asia/Kolkata', slug: 'ghaziabad' },
  { city: 'Ludhiana', state: 'Punjab', country: 'India', latitude: 30.9010, longitude: 75.8573, timezone: 'Asia/Kolkata', slug: 'ludhiana' },
  { city: 'Agra', state: 'Uttar Pradesh', country: 'India', latitude: 27.1767, longitude: 78.0081, timezone: 'Asia/Kolkata', slug: 'agra' },
  { city: 'Nashik', state: 'Maharashtra', country: 'India', latitude: 19.9975, longitude: 73.7898, timezone: 'Asia/Kolkata', slug: 'nashik' },
  { city: 'Faridabad', state: 'Haryana', country: 'India', latitude: 28.4089, longitude: 77.3178, timezone: 'Asia/Kolkata', slug: 'faridabad' },
  { city: 'Meerut', state: 'Uttar Pradesh', country: 'India', latitude: 28.9845, longitude: 77.7064, timezone: 'Asia/Kolkata', slug: 'meerut' },
  { city: 'Rajkot', state: 'Gujarat', country: 'India', latitude: 22.3039, longitude: 70.8022, timezone: 'Asia/Kolkata', slug: 'rajkot' },
  { city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', latitude: 25.3176, longitude: 82.9739, timezone: 'Asia/Kolkata', slug: 'varanasi' },
  { city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', latitude: 34.0837, longitude: 74.7973, timezone: 'Asia/Kolkata', slug: 'srinagar' },
  { city: 'Aurangabad', state: 'Maharashtra', country: 'India', latitude: 19.8762, longitude: 75.3433, timezone: 'Asia/Kolkata', slug: 'aurangabad' },
  { city: 'Dhanbad', state: 'Jharkhand', country: 'India', latitude: 23.7957, longitude: 86.4304, timezone: 'Asia/Kolkata', slug: 'dhanbad' },
  { city: 'Amritsar', state: 'Punjab', country: 'India', latitude: 31.6340, longitude: 74.8723, timezone: 'Asia/Kolkata', slug: 'amritsar' },
  { city: 'Allahabad', state: 'Uttar Pradesh', country: 'India', latitude: 25.4358, longitude: 81.8463, timezone: 'Asia/Kolkata', slug: 'allahabad' },
  { city: 'Ranchi', state: 'Jharkhand', country: 'India', latitude: 23.3441, longitude: 85.3096, timezone: 'Asia/Kolkata', slug: 'ranchi' },
  { city: 'Howrah', state: 'West Bengal', country: 'India', latitude: 22.5958, longitude: 88.2636, timezone: 'Asia/Kolkata', slug: 'howrah' },
  { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', latitude: 11.0168, longitude: 76.9558, timezone: 'Asia/Kolkata', slug: 'coimbatore' },
  { city: 'Jabalpur', state: 'Madhya Pradesh', country: 'India', latitude: 23.1815, longitude: 79.9864, timezone: 'Asia/Kolkata', slug: 'jabalpur' },
  { city: 'Gwalior', state: 'Madhya Pradesh', country: 'India', latitude: 26.2183, longitude: 78.1828, timezone: 'Asia/Kolkata', slug: 'gwalior' },
  { city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', latitude: 16.5062, longitude: 80.6480, timezone: 'Asia/Kolkata', slug: 'vijayawada' },
  { city: 'Jodhpur', state: 'Rajasthan', country: 'India', latitude: 26.2389, longitude: 73.0243, timezone: 'Asia/Kolkata', slug: 'jodhpur' },
  { city: 'Madurai', state: 'Tamil Nadu', country: 'India', latitude: 9.9252, longitude: 78.1198, timezone: 'Asia/Kolkata', slug: 'madurai' },
  { city: 'Raipur', state: 'Chhattisgarh', country: 'India', latitude: 21.2514, longitude: 81.6296, timezone: 'Asia/Kolkata', slug: 'raipur' },
  { city: 'Kota', state: 'Rajasthan', country: 'India', latitude: 25.2138, longitude: 75.8648, timezone: 'Asia/Kolkata', slug: 'kota' },
  { city: 'Chandigarh', state: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794, timezone: 'Asia/Kolkata', slug: 'chandigarh' },
  { city: 'Guwahati', state: 'Assam', country: 'India', latitude: 26.1445, longitude: 91.7362, timezone: 'Asia/Kolkata', slug: 'guwahati' },
  { city: 'Mysore', state: 'Karnataka', country: 'India', latitude: 12.2958, longitude: 76.6394, timezone: 'Asia/Kolkata', slug: 'mysore' },
  { city: 'Bhubaneswar', state: 'Odisha', country: 'India', latitude: 20.2961, longitude: 85.8245, timezone: 'Asia/Kolkata', slug: 'bhubaneswar' },
  { city: 'Dehradun', state: 'Uttarakhand', country: 'India', latitude: 30.3165, longitude: 78.0322, timezone: 'Asia/Kolkata', slug: 'dehradun' },
  { city: 'Shimla', state: 'Himachal Pradesh', country: 'India', latitude: 31.1048, longitude: 77.1734, timezone: 'Asia/Kolkata', slug: 'shimla' },
  { city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', latitude: 8.5241, longitude: 76.9366, timezone: 'Asia/Kolkata', slug: 'thiruvananthapuram' },
  { city: 'Kochi', state: 'Kerala', country: 'India', latitude: 9.9312, longitude: 76.2673, timezone: 'Asia/Kolkata', slug: 'kochi' },
  { city: 'Patna', state: 'Bihar', country: 'India', latitude: 25.5941, longitude: 85.1376, timezone: 'Asia/Kolkata', slug: 'patna' },

  // USA - Top 50 Cities
  { city: 'New York', state: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York', slug: 'new-york' },
  { city: 'Los Angeles', state: 'California', country: 'USA', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', slug: 'los-angeles' },
  { city: 'Chicago', state: 'Illinois', country: 'USA', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago', slug: 'chicago' },
  { city: 'Houston', state: 'Texas', country: 'USA', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago', slug: 'houston' },
  { city: 'Phoenix', state: 'Arizona', country: 'USA', latitude: 33.4484, longitude: -112.0740, timezone: 'America/Phoenix', slug: 'phoenix' },
  { city: 'Philadelphia', state: 'Pennsylvania', country: 'USA', latitude: 39.9526, longitude: -75.1652, timezone: 'America/New_York', slug: 'philadelphia' },
  { city: 'San Antonio', state: 'Texas', country: 'USA', latitude: 29.4241, longitude: -98.4936, timezone: 'America/Chicago', slug: 'san-antonio' },
  { city: 'San Diego', state: 'California', country: 'USA', latitude: 32.7157, longitude: -117.1611, timezone: 'America/Los_Angeles', slug: 'san-diego' },
  { city: 'Dallas', state: 'Texas', country: 'USA', latitude: 32.7767, longitude: -96.7970, timezone: 'America/Chicago', slug: 'dallas' },
  { city: 'San Jose', state: 'California', country: 'USA', latitude: 37.3382, longitude: -121.8863, timezone: 'America/Los_Angeles', slug: 'san-jose' },
  { city: 'Austin', state: 'Texas', country: 'USA', latitude: 30.2672, longitude: -97.7431, timezone: 'America/Chicago', slug: 'austin' },
  { city: 'Jacksonville', state: 'Florida', country: 'USA', latitude: 30.3322, longitude: -81.6557, timezone: 'America/New_York', slug: 'jacksonville' },
  { city: 'Fort Worth', state: 'Texas', country: 'USA', latitude: 32.7555, longitude: -97.3308, timezone: 'America/Chicago', slug: 'fort-worth' },
  { city: 'Columbus', state: 'Ohio', country: 'USA', latitude: 39.9612, longitude: -82.9988, timezone: 'America/New_York', slug: 'columbus' },
  { city: 'Charlotte', state: 'North Carolina', country: 'USA', latitude: 35.2271, longitude: -80.8431, timezone: 'America/New_York', slug: 'charlotte' },
  { city: 'San Francisco', state: 'California', country: 'USA', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles', slug: 'san-francisco' },
  { city: 'Indianapolis', state: 'Indiana', country: 'USA', latitude: 39.7684, longitude: -86.1581, timezone: 'America/Indiana/Indianapolis', slug: 'indianapolis' },
  { city: 'Seattle', state: 'Washington', country: 'USA', latitude: 47.6062, longitude: -122.3321, timezone: 'America/Los_Angeles', slug: 'seattle' },
  { city: 'Denver', state: 'Colorado', country: 'USA', latitude: 39.7392, longitude: -104.9903, timezone: 'America/Denver', slug: 'denver' },
  { city: 'Washington', state: 'District of Columbia', country: 'USA', latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York', slug: 'washington-dc' },
  { city: 'Boston', state: 'Massachusetts', country: 'USA', latitude: 42.3601, longitude: -71.0589, timezone: 'America/New_York', slug: 'boston' },
  { city: 'El Paso', state: 'Texas', country: 'USA', latitude: 31.7619, longitude: -106.4850, timezone: 'America/Denver', slug: 'el-paso' },
  { city: 'Nashville', state: 'Tennessee', country: 'USA', latitude: 36.1627, longitude: -86.7816, timezone: 'America/Chicago', slug: 'nashville' },
  { city: 'Detroit', state: 'Michigan', country: 'USA', latitude: 42.3314, longitude: -83.0458, timezone: 'America/Detroit', slug: 'detroit' },
  { city: 'Oklahoma City', state: 'Oklahoma', country: 'USA', latitude: 35.4676, longitude: -97.5164, timezone: 'America/Chicago', slug: 'oklahoma-city' },
  { city: 'Portland', state: 'Oregon', country: 'USA', latitude: 45.5152, longitude: -122.6784, timezone: 'America/Los_Angeles', slug: 'portland' },
  { city: 'Las Vegas', state: 'Nevada', country: 'USA', latitude: 36.1699, longitude: -115.1398, timezone: 'America/Los_Angeles', slug: 'las-vegas' },
  { city: 'Memphis', state: 'Tennessee', country: 'USA', latitude: 35.1495, longitude: -90.0490, timezone: 'America/Chicago', slug: 'memphis' },
  { city: 'Louisville', state: 'Kentucky', country: 'USA', latitude: 38.2527, longitude: -85.7585, timezone: 'America/New_York', slug: 'louisville' },
  { city: 'Baltimore', state: 'Maryland', country: 'USA', latitude: 39.2904, longitude: -76.6122, timezone: 'America/New_York', slug: 'baltimore' },
  { city: 'Milwaukee', state: 'Wisconsin', country: 'USA', latitude: 43.0389, longitude: -87.9065, timezone: 'America/Chicago', slug: 'milwaukee' },
  { city: 'Albuquerque', state: 'New Mexico', country: 'USA', latitude: 35.0844, longitude: -106.6504, timezone: 'America/Denver', slug: 'albuquerque' },
  { city: 'Tucson', state: 'Arizona', country: 'USA', latitude: 32.2226, longitude: -110.9747, timezone: 'America/Phoenix', slug: 'tucson' },
  { city: 'Fresno', state: 'California', country: 'USA', latitude: 36.7378, longitude: -119.7871, timezone: 'America/Los_Angeles', slug: 'fresno' },
  { city: 'Sacramento', state: 'California', country: 'USA', latitude: 38.5816, longitude: -121.4944, timezone: 'America/Los_Angeles', slug: 'sacramento' },
  { city: 'Kansas City', state: 'Missouri', country: 'USA', latitude: 39.0997, longitude: -94.5786, timezone: 'America/Chicago', slug: 'kansas-city' },
  { city: 'Mesa', state: 'Arizona', country: 'USA', latitude: 33.4152, longitude: -111.8315, timezone: 'America/Phoenix', slug: 'mesa' },
  { city: 'Atlanta', state: 'Georgia', country: 'USA', latitude: 33.7490, longitude: -84.3880, timezone: 'America/New_York', slug: 'atlanta' },
  { city: 'Omaha', state: 'Nebraska', country: 'USA', latitude: 41.2565, longitude: -95.9345, timezone: 'America/Chicago', slug: 'omaha' },
  { city: 'Colorado Springs', state: 'Colorado', country: 'USA', latitude: 38.8339, longitude: -104.8214, timezone: 'America/Denver', slug: 'colorado-springs' },
  { city: 'Raleigh', state: 'North Carolina', country: 'USA', latitude: 35.7796, longitude: -78.6382, timezone: 'America/New_York', slug: 'raleigh' },
  { city: 'Miami', state: 'Florida', country: 'USA', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York', slug: 'miami' },
  { city: 'Long Beach', state: 'California', country: 'USA', latitude: 33.7701, longitude: -118.1937, timezone: 'America/Los_Angeles', slug: 'long-beach' },
  { city: 'Virginia Beach', state: 'Virginia', country: 'USA', latitude: 36.8529, longitude: -75.9780, timezone: 'America/New_York', slug: 'virginia-beach' },
  { city: 'Oakland', state: 'California', country: 'USA', latitude: 37.8044, longitude: -122.2712, timezone: 'America/Los_Angeles', slug: 'oakland' },
  { city: 'Minneapolis', state: 'Minnesota', country: 'USA', latitude: 44.9778, longitude: -93.2650, timezone: 'America/Chicago', slug: 'minneapolis' },
  { city: 'Tampa', state: 'Florida', country: 'USA', latitude: 27.9506, longitude: -82.4572, timezone: 'America/New_York', slug: 'tampa' },
  { city: 'Tulsa', state: 'Oklahoma', country: 'USA', latitude: 36.1540, longitude: -95.9928, timezone: 'America/Chicago', slug: 'tulsa' },
  { city: 'Arlington', state: 'Texas', country: 'USA', latitude: 32.7357, longitude: -97.1081, timezone: 'America/Chicago', slug: 'arlington' },
  { city: 'New Orleans', state: 'Louisiana', country: 'USA', latitude: 29.9511, longitude: -90.0715, timezone: 'America/Chicago', slug: 'new-orleans' }
];

export function getCityBySlug(slug: string): CityData | undefined {
  return TOP_CITIES.find(city => city.slug === slug);
}

export function getCitiesByCountry(country: 'India' | 'USA'): CityData[] {
  return TOP_CITIES.filter(city => city.country === country);
}

export function searchCities(query: string): CityData[] {
  const lowerQuery = query.toLowerCase();
  return TOP_CITIES.filter(city => 
    city.city.toLowerCase().includes(lowerQuery) ||
    city.state.toLowerCase().includes(lowerQuery) ||
    city.slug.includes(lowerQuery)
  );
}
