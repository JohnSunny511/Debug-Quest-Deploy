// seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Question = require("../models/Question");

dotenv.config(); // load .env

const questions = [
  // ✅ Easy Questions
  {
    id: 1,
    level: "easy",
    title: "Area Calculation Bug",
    language: "Python",
    code: `def calculate_area(radius):
area = 3.14 * r ** 2
print("Area is: " + area)

calculatearea(5)`,
    expected: "Should print the area of the circle correctly",
    correctAnswer: `def calculate_area(radius):
    area = 3.14 * radius ** 2
    print("Area is: " + str(area))

calculate_area(5)`,
  },
  {
    id: 2,
    level: "easy",
    title: "Sum of List Elements",
    language: "Python",
    code: `nums = [1, 2, 3, 4]
total = 0
for i in nums
    total += i
print(total)`,
    expected: "Should print 10",
    correctAnswer: `nums = [1, 2, 3, 4]
total = 0
for i in nums:
    total += i
print(total)`,
  },
  {
    id: 3,
    level: "easy",
    title: "String Reversal Bug",
    language: "Python",
    code: `text = "hello"
reversed = text[::-1]
print(reversed())`,
    expected: "Should print 'olleh'",
    correctAnswer: `text = "hello"
reversed_text = text[::-1]
print(reversed_text)`,
  },
  {
    id: 4,
    level: "easy",
    title: "Even or Odd Check",
    language: "Python",
    code: `num = 7
if num % 2 = 0:
    print("Even")
else:
    print("Odd")`,
    expected: "Should print 'Odd'",
    correctAnswer: `num = 7
if num % 2 == 0:
    print("Even")
else:
    print("Odd")`,
  },
  {
    id: 5,
    level: "easy",
    title: "Find Largest Number",
    language: "Python",
    code: `nums = [4, 9, 2]
largest = nums[0]
for n in nums:
    if n > largest
        largest = n
print(largest)`,
    expected: "Should print 9",
    correctAnswer: `nums = [4, 9, 2]
largest = nums[0]
for n in nums:
    if n > largest:
        largest = n
print(largest)`,
  },

  // ✅ Medium Questions
  {
    id: 6,
    level: "medium",
    title: "Factorial Logic Error",
    language: "Python",
    code: `def factorial(n):
    result = 1
    for i in range(n):
        result *= i
    return result

print(factorial(5))`,
    expected: "Should print factorial of 5",
    correctAnswer: `def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(factorial(5))`,
  },
  {
    id: 7,
    level: "medium",
    title: "Palindrome Check Bug",
    language: "Python",
    code: `def is_palindrome(s):
    return s == s.reverse()

print(is_palindrome("radar"))`,
    expected: "Should print True",
    correctAnswer: `def is_palindrome(s):
    return s == s[::-1]

print(is_palindrome("radar"))`,
  },
  {
    id: 8,
    level: "medium",
    title: "List Comprehension Error",
    language: "Python",
    code: `nums = [1, 2, 3, 4]
squares = [x**2 for x in nums
print(squares)`,
    expected: "Should print [1, 4, 9, 16]",
    correctAnswer: `nums = [1, 2, 3, 4]
squares = [x**2 for x in nums]
print(squares)`,
  },
  {
    id: 9,
    level: "medium",
    title: "Dictionary Update Bug",
    language: "Python",
    code: `data = {"a": 1, "b": 2}
data["c"] = 3
print(data.get("c")`,
    expected: "Should print 3",
    correctAnswer: `data = {"a": 1, "b": 2}
data["c"] = 3
print(data.get("c"))`,
  },
  {
    id: 10,
    level: "medium",
    title: "Find Max in Nested List",
    language: "Python",
    code: `matrix = [[1,2],[3,4]]
max_val = matrix[0][0]
for row in matrix:
    for val in row
        if val > max_val:
            max_val = val
print(max_val)`,
    expected: "Should print 4",
    correctAnswer: `matrix = [[1,2],[3,4]]
max_val = matrix[0][0]
for row in matrix:
    for val in row:
        if val > max_val:
            max_val = val
print(max_val)`,
  },

  // ✅ Hard Questions
  {
    id: 11,
    level: "hard",
    title: "Fibonacci Sequence Bug",
    language: "Python",
    code: `def fibonacci(n):
    a, b = 0, 1
    for i in range(n):
        a = b
        b = a + b
    print(b)

fibonacci(5)`,
    expected: "Should print first n Fibonacci numbers",
    correctAnswer: `def fibonacci(n):
    a, b = 0, 1
    for i in range(n):
        print(a)
        a, b = b, a + b

fibonacci(5)`,
  },
  {
    id: 12,
    level: "hard",
    title: "Merge Two Sorted Lists",
    language: "Python",
    code: `def merge(a, b):
    result = []
    while a and b:
        if a[0] < b[0]
            result.append(a.pop(0))
        else:
            result.append(b.pop(0))
    return result + a + b

print(merge([1,3,5],[2,4,6]))`,
    expected: "Should print [1,2,3,4,5,6]",
    correctAnswer: `def merge(a, b):
    result = []
    while a and b:
        if a[0] < b[0]:
            result.append(a.pop(0))
        else:
            result.append(b.pop(0))
    return result + a + b

print(merge([1,3,5],[2,4,6]))`,
  },
  {
    id: 13,
    level: "hard",
    title: "Prime Numbers in Range",
    language: "Python",
    code: `def primes(n):
    for i in range(2, n):
        for j in range(2, i):
            if i % j = 0:
                break
        else:
            print(i)

primes(10)`,
    expected: "Should print prime numbers less than 10",
    correctAnswer: `def primes(n):
    for i in range(2, n):
        for j in range(2, i):
            if i % j == 0:
                break
        else:
            print(i)

primes(10)`,
  },
  {
    id: 14,
    level: "hard",
    title: "Matrix Transpose Bug",
    language: "Python",
    code: `matrix = [[1,2,3],[4,5,6]]
transposed = []
for i in range(len(matrix)):
    row = []
    for j in range(len(matrix[0])):
        row.append(matrix[j][i])
    transposed.append(row)
print(transposed)`,
    expected: "Should print [[1,4],[2,5],[3,6]]",
    correctAnswer: `matrix = [[1,2,3],[4,5,6]]
transposed = []
for i in range(len(matrix[0])):
    row = []
    for j in range(len(matrix)):
        row.append(matrix[j][i])
    transposed.append(row)
print(transposed)`,
  },
  {
    id: 15,
    level: "hard",
    title: "Count Vowels in String",
    language: "Python",
    code: `text = "OpenAI"
count = 0
for c in text:
    if c in "aeiou":
        count += 1
print(count)`,
    expected: "Should count vowels (case-insensitive)",
    correctAnswer: `text = "OpenAI"
count = 0
for c in text.lower():
    if c in "aeiou":
        count += 1
print(count)`,
  },
];


const seedDB = async () => {
  try {
    await connectDB(); // connect to MongoDB
    await Question.deleteMany({});
    await Question.insertMany(questions);
    console.log("✅ Sample questions inserted");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding DB:", err);
    process.exit(1);
  }
};

seedDB();
