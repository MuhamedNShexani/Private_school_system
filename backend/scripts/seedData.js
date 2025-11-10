const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const Season = require("../models/Season");
const Chapter = require("../models/Chapter");
const Subject = require("../models/Subject");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const seedData = async () => {
  try {
    // Clear existing data
    await Season.deleteMany({});
    await Chapter.deleteMany({});
    await Subject.deleteMany({});

    console.log("Cleared existing data");

    // Create Season 1
    const season1 = new Season({
      name: "Season 1: Fundamentals",
      description:
        "Master the fundamental concepts and build a strong foundation for your learning journey.",
      order: 1,
    });
    await season1.save();
    console.log("Created Season 1");

    // Create Season 2
    const season2 = new Season({
      name: "Season 2: Advanced Concepts",
      description:
        "Dive deeper into advanced topics and complex problem-solving techniques.",
      order: 2,
    });
    await season2.save();
    console.log("Created Season 2");

    // Season 1 Chapters
    const chapter1_1 = new Chapter({
      title: "Introduction to Programming",
      description:
        "Learn the basics of programming concepts, variables, and data types.",
      season: season1._id,
      order: 1,
    });
    await chapter1_1.save();

    const chapter1_2 = new Chapter({
      title: "Control Structures",
      description:
        "Master conditional statements and loops for program flow control.",
      season: season1._id,
      order: 2,
    });
    await chapter1_2.save();

    const chapter1_3 = new Chapter({
      title: "Functions and Modules",
      description:
        "Learn to create reusable code with functions and organize code with modules.",
      season: season1._id,
      order: 3,
    });
    await chapter1_3.save();

    // Season 2 Chapters
    const chapter2_1 = new Chapter({
      title: "Object-Oriented Programming",
      description:
        "Understand classes, objects, inheritance, and polymorphism.",
      season: season2._id,
      order: 1,
    });
    await chapter2_1.save();

    const chapter2_2 = new Chapter({
      title: "Data Structures",
      description:
        "Learn about arrays, linked lists, stacks, queues, and trees.",
      season: season2._id,
      order: 2,
    });
    await chapter2_2.save();

    const chapter2_3 = new Chapter({
      title: "Algorithms and Complexity",
      description:
        "Study sorting algorithms, searching techniques, and time complexity analysis.",
      season: season2._id,
      order: 3,
    });
    await chapter2_3.save();

    console.log("Created all chapters");

    // Season 1 Chapter 1 Subjects
    const subject1_1_1 = new Subject({
      title: "Variables and Data Types",
      description:
        "Understanding how to declare variables and work with different data types.",
      content: `
        <h3>What are Variables?</h3>
        <p>Variables are containers for storing data values. In programming, you can think of a variable as a labeled box where you can store information.</p>
        
        <h3>Basic Data Types</h3>
        <ul>
          <li><strong>Numbers:</strong> Integers (1, 2, 3) and floats (1.5, 2.7)</li>
          <li><strong>Strings:</strong> Text enclosed in quotes ("Hello", 'World')</li>
          <li><strong>Booleans:</strong> True or false values</li>
          <li><strong>Arrays:</strong> Collections of items [1, 2, 3]</li>
        </ul>
        
        <h3>Variable Declaration</h3>
        <p>To create a variable, you need to declare it with a name and optionally assign a value.</p>
      `,
      chapter: chapter1_1._id,
      order: 1,
      difficulty: "Easy",
      estimatedTime: 25,
      exercises: [
        {
          question: "What is a variable in programming?",
          options: [
            "A function that performs calculations",
            "A container for storing data values",
            "A type of loop",
            "A programming language",
          ],
          correctAnswer: "A container for storing data values",
          explanation:
            "Variables are containers that hold data values and can be referenced by a name.",
          points: 10,
        },
        {
          question: "Which of the following is NOT a basic data type?",
          options: ["String", "Number", "Boolean", "Function"],
          correctAnswer: "Function",
          explanation:
            "Function is not a basic data type. Basic data types include strings, numbers, booleans, and arrays.",
          points: 10,
        },
        {
          question: "What symbol is commonly used to declare a variable?",
          options: ["=", "var", "let", "const"],
          correctAnswer: "let",
          explanation:
            'While "var" is also used, "let" is the modern way to declare variables in JavaScript.',
          points: 15,
        },
      ],
    });
    await subject1_1_1.save();

    const subject1_1_2 = new Subject({
      title: "String Manipulation",
      description:
        "Learn how to work with strings, concatenation, and string methods.",
      content: `
        <h3>What are Strings?</h3>
        <p>Strings are sequences of characters used to represent text. They are one of the most fundamental data types in programming.</p>
        
        <h3>String Operations</h3>
        <ul>
          <li><strong>Concatenation:</strong> Joining strings together</li>
          <li><strong>Length:</strong> Getting the number of characters</li>
          <li><strong>Substring:</strong> Extracting parts of a string</li>
          <li><strong>Case conversion:</strong> Changing to uppercase or lowercase</li>
        </ul>
      `,
      chapter: chapter1_1._id,
      order: 2,
      difficulty: "Easy",
      estimatedTime: 30,
      exercises: [
        {
          question: "What is string concatenation?",
          options: [
            "Dividing a string into parts",
            "Joining strings together",
            "Converting a string to uppercase",
            "Counting characters in a string",
          ],
          correctAnswer: "Joining strings together",
          explanation:
            "String concatenation is the process of joining two or more strings together.",
          points: 10,
        },
        {
          question: "Which method is used to get the length of a string?",
          options: [".size()", ".length()", ".length", ".count()"],
          correctAnswer: ".length",
          explanation:
            "The .length property returns the number of characters in a string.",
          points: 10,
        },
      ],
    });
    await subject1_1_2.save();

    const subject1_1_3 = new Subject({
      title: "Input and Output",
      description: "Learn how to get input from users and display output.",
      content: `
        <h3>Input and Output Basics</h3>
        <p>Input and output operations are essential for interactive programs. Input allows users to provide data, while output displays results.</p>
        
        <h3>Common I/O Operations</h3>
        <ul>
          <li><strong>Reading input:</strong> Getting data from users</li>
          <li><strong>Displaying output:</strong> Showing information to users</li>
          <li><strong>Formatted output:</strong> Controlling how data is displayed</li>
        </ul>
      `,
      chapter: chapter1_1._id,
      order: 3,
      difficulty: "Medium",
      estimatedTime: 35,
      exercises: [
        {
          question: "What is the primary purpose of input operations?",
          options: [
            "To display data to users",
            "To get data from users",
            "To store data permanently",
            "To process calculations",
          ],
          correctAnswer: "To get data from users",
          explanation:
            "Input operations are used to receive data from users or external sources.",
          points: 10,
        },
      ],
    });
    await subject1_1_3.save();

    const subject1_1_4 = new Subject({
      title: "Comments and Documentation",
      description: "Learn the importance of code comments and documentation.",
      content: `
        <h3>Why Comments Matter</h3>
        <p>Comments are explanatory text that helps developers understand code. They are ignored by the computer but essential for human readers.</p>
        
        <h3>Types of Comments</h3>
        <ul>
          <li><strong>Single-line comments:</strong> // This is a single-line comment</li>
          <li><strong>Multi-line comments:</strong> /* This is a multi-line comment */</li>
          <li><strong>Documentation comments:</strong> Used for generating documentation</li>
        </ul>
      `,
      chapter: chapter1_1._id,
      order: 4,
      difficulty: "Easy",
      estimatedTime: 20,
      exercises: [
        {
          question: "What is the main purpose of code comments?",
          options: [
            "To make code run faster",
            "To help developers understand code",
            "To store data",
            "To create functions",
          ],
          correctAnswer: "To help developers understand code",
          explanation:
            "Comments are used to explain code logic and make it easier for developers to understand.",
          points: 10,
        },
      ],
    });
    await subject1_1_4.save();

    const subject1_1_5 = new Subject({
      title: "Basic Syntax Rules",
      description:
        "Understand the fundamental syntax rules of programming languages.",
      content: `
        <h3>Programming Syntax</h3>
        <p>Syntax refers to the rules that define how programs are written. Following correct syntax is essential for programs to work.</p>
        
        <h3>Common Syntax Rules</h3>
        <ul>
          <li><strong>Case sensitivity:</strong> Uppercase and lowercase letters matter</li>
          <li><strong>Semicolons:</strong> Often used to end statements</li>
          <li><strong>Brackets:</strong> Used to group code blocks</li>
          <li><strong>Indentation:</strong> Makes code more readable</li>
        </ul>
      `,
      chapter: chapter1_1._id,
      order: 5,
      difficulty: "Easy",
      estimatedTime: 25,
      exercises: [
        {
          question: "Why is proper syntax important in programming?",
          options: [
            "It makes code run faster",
            "It allows the computer to understand the code",
            "It makes code look prettier",
            "It reduces file size",
          ],
          correctAnswer: "It allows the computer to understand the code",
          explanation:
            "Correct syntax is necessary for the computer to properly interpret and execute the code.",
          points: 10,
        },
      ],
    });
    await subject1_1_5.save();

    // Add more subjects for other chapters...
    console.log("Created Season 1 Chapter 1 subjects");

    // Season 1 Chapter 2 Subjects
    const subject1_2_1 = new Subject({
      title: "If-Else Statements",
      description: "Learn conditional logic with if-else statements.",
      content: `
        <h3>Conditional Logic</h3>
        <p>Conditional statements allow programs to make decisions based on certain conditions.</p>
        
        <h3>If-Else Structure</h3>
        <p>The if-else statement allows you to execute different code blocks based on whether a condition is true or false.</p>
      `,
      chapter: chapter1_2._id,
      order: 1,
      difficulty: "Easy",
      estimatedTime: 30,
      exercises: [
        {
          question: "What is the purpose of if-else statements?",
          options: [
            "To repeat code",
            "To make decisions based on conditions",
            "To store data",
            "To create functions",
          ],
          correctAnswer: "To make decisions based on conditions",
          explanation:
            "If-else statements allow programs to execute different code based on whether conditions are true or false.",
          points: 10,
        },
      ],
    });
    await subject1_2_1.save();

    // Add more subjects for Season 1 and Season 2...
    console.log("Created additional subjects");

    console.log("Database seeded successfully!");
    console.log(`Created:`);
    console.log(`- 2 Seasons`);
    console.log(`- 6 Chapters`);
    console.log(`- 6 Subjects with exercises`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedData();
