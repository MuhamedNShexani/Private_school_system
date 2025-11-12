const axios = require('axios');

const testAPI = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/translations?language=en');
    
    console.log('\n=== API Response Test ===');
    console.log('Status:', response.status);
    console.log('Response structure:', {
      success: response.data.success,
      dataKeys: Object.keys(response.data.data || {}).length,
      sample: Object.entries(response.data.data || {}).slice(0, 5)
    });

    // Check if our quiz translations are there
    const quizKeys = Object.keys(response.data.data || {}).filter(k => k.includes('chapterQuizzes'));
    console.log('\nChapterQuizzes translations found:', quizKeys.length);
    if (quizKeys.length > 0) {
      console.log('Sample:');
      quizKeys.slice(0, 5).forEach(key => {
        console.log(`  - ${key}: ${response.data.data[key]}`);
      });
    } else {
      console.log('❌ NO chapterQuizzes translations returned by API!');
    }

  } catch (error) {
    console.error('Error calling API:', error.message);
  }
};

testAPI();

