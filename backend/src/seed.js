require('dotenv').config();
const mongoose = require('mongoose');
const RightsZone = require('./models/RightsZone');
const Badge = require('./models/Badge');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const zones = [
  {
    name: 'School of Knowledge',
    right: 'education',
    description: 'Every child has the right to free education!',
    position: { x: 200, y: 150 },
    color: '#4FC3F7',
    xpReward: 50,
    questions: [
      {
        question: 'Do all children have the right to go to school?',
        options: ['Only rich children', 'Yes, every child', 'Only boys', 'Only in cities'],
        correctAnswer: 1,
        explanation: 'Article 28 of the UN Convention says every child has the right to education!'
      },
      {
        question: 'What should education help children do?',
        options: ['Only memorize facts', 'Develop their talents and abilities', 'Work in factories', 'Obey without question'],
        correctAnswer: 1,
        explanation: 'Education should help every child grow and reach their full potential.'
      }
    ]
  },
  {
    name: 'Food Forest',
    right: 'food',
    description: 'Every child has the right to healthy food and clean water!',
    position: { x: 500, y: 200 },
    color: '#81C784',
    xpReward: 50,
    questions: [
      {
        question: 'What is a basic right every child has regarding food?',
        options: ['Only vegetables', 'The right to enough nutritious food', 'Fast food only', 'No rights about food'],
        correctAnswer: 1,
        explanation: 'Every child has the right to food, clean water, and a healthy environment.'
      },
      {
        question: 'Who is responsible for making sure children get enough food?',
        options: ['Only the child', 'Governments and families together', 'Nobody', 'Only schools'],
        correctAnswer: 1,
        explanation: 'Both governments and families share the responsibility to ensure children are fed.'
      }
    ]
  },
  {
    name: 'Safety Castle',
    right: 'safety',
    description: 'Every child has the right to be protected from harm!',
    position: { x: 350, y: 350 },
    color: '#EF5350',
    xpReward: 50,
    questions: [
      {
        question: 'What should you do if someone makes you feel unsafe?',
        options: ['Keep it secret', 'Tell a trusted adult', 'Ignore it', 'Handle it alone'],
        correctAnswer: 1,
        explanation: 'Always tell a trusted adult like a parent, teacher, or guardian if you feel unsafe.'
      },
      {
        question: 'Which of these is a form of abuse?',
        options: ['Getting homework help', 'Being hit by an adult', 'Playing games', 'Going to school'],
        correctAnswer: 1,
        explanation: 'No adult has the right to hit or hurt a child. This is abuse and must be reported.'
      }
    ]
  },
  {
    name: 'Health Haven',
    right: 'health',
    description: 'Every child has the right to the best possible health!',
    position: { x: 150, y: 380 },
    color: '#AB47BC',
    xpReward: 50,
    questions: [
      {
        question: 'What does the right to health include?',
        options: ['Only medicine when sick', 'Access to doctors, clean water and healthy food', 'Going to hospital only', 'Nothing'],
        correctAnswer: 1,
        explanation: 'The right to health means access to healthcare, clean water, and a healthy environment.'
      },
      {
        question: 'Should children with disabilities have equal access to healthcare?',
        options: ['No', 'Yes, absolutely', 'Only sometimes', 'Only in rich countries'],
        correctAnswer: 1,
        explanation: 'Every child, regardless of ability, has equal rights to healthcare.'
      }
    ]
  },
  {
    name: 'Play Paradise',
    right: 'play',
    description: 'Every child has the right to play and rest!',
    position: { x: 550, y: 400 },
    color: '#FFB74D',
    xpReward: 50,
    questions: [
      {
        question: 'Is play a right or a privilege for children?',
        options: ['A privilege', 'A right', 'Neither', 'Only for young children'],
        correctAnswer: 1,
        explanation: 'Article 31 of the UN Convention protects every child\'s right to play and leisure!'
      },
      {
        question: 'Why is play important for children?',
        options: ['It wastes time', 'It helps development, creativity and health', 'It is not important', 'Only for fun'],
        correctAnswer: 1,
        explanation: 'Play is essential for physical, mental, and social development of every child.'
      }
    ]
  }
];

const badges = [
  {
    name: 'Education Explorer',
    description: 'Completed the School of Knowledge zone',
    icon: '📚',
    category: 'zone',
    xpReward: 25
  },
  {
    name: 'Food Champion',
    description: 'Completed the Food Forest zone',
    icon: '🥗',
    category: 'zone',
    xpReward: 25
  },
  {
    name: 'Safety Guardian',
    description: 'Completed the Safety Castle zone',
    icon: '🛡️',
    category: 'zone',
    xpReward: 25
  },
  {
    name: 'Health Hero',
    description: 'Completed the Health Haven zone',
    icon: '❤️',
    category: 'zone',
    xpReward: 25
  },
  {
    name: 'Play Pioneer',
    description: 'Completed the Play Paradise zone',
    icon: '🎮',
    category: 'zone',
    xpReward: 25
  },
  {
    name: 'Rights Rookie',
    description: 'Earned your first 50 XP',
    icon: '⭐',
    category: 'xp',
    requiredXP: 50,
    xpReward: 10
  },
  {
    name: 'Rights Champion',
    description: 'Completed all 5 rights zones',
    icon: '🏆',
    category: 'special',
    xpReward: 100
  }
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing data
    await RightsZone.deleteMany({});
    await Badge.deleteMany({});
    console.log('🗑️  Cleared existing zones and badges');

    // Insert zones
    const createdZones = await RightsZone.insertMany(zones);
    console.log(`✅ Created ${createdZones.length} rights zones`);

    // Link zone badges to their zones
    const updatedBadges = badges.map((badge, index) => {
      if (index < 5) {  // First 5 badges are zone-based
        badge.requiredZoneId = createdZones[index]._id;
      }
      return badge;
    });

    const createdBadges = await Badge.insertMany(updatedBadges);
    console.log(`✅ Created ${createdBadges.length} badges`);

    console.log('\n🎮 Database seeded successfully!');
    console.log('Zones:', createdZones.map(z => z.name).join(', '));
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();