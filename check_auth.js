// Check what user ID is stored in local storage vs database

const authDataRaw = localStorage.getItem('get-on-auth');
if (authDataRaw) {
    const authData = JSON.parse(authDataRaw);
    console.log('=== Auth Store Data ===');
    console.log('Authenticated:', authData.state.isAuthenticated);
    console.log('User Type:', authData.state.userType);
    console.log('Current User ID:', authData.state.currentUser?.id);
    console.log('Current User Email:', authData.state.currentUser?.email);
} else {
    console.log('No auth data found in localStorage');
}

console.log('\n=== Expected IDs from Seed ===');
console.log('Renter ID should be: 064c2e12-0cdc-4e3a-a449-64c1f319bd88');
console.log('Email should be: test.renter@test.geton.com');
