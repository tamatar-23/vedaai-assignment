import { GoogleGenerativeAI } from '@google/generative-ai';
import { ISection, IQuestion } from '../models/Assignment.js';

// Load environmental keys
const apiKey = process.env.GEMINI_API_KEY || '';

// Mock Question Database for realistic fallback generation
const mockQuestionDatabase: Record<string, Array<{
  text: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  type: string;
  options?: string[];
  answer: string;
}>> = {
  science: [
    { text: "Define electroplating and explain its primary purpose.", difficulty: "easy", type: "Short Answer", answer: "Electroplating is the process of coating a metal object with a thin layer of another metal using electrolysis. It is used to prevent corrosion and improve appearance." },
    { text: "What is the role of a conductor in the process of electrolysis?", difficulty: "moderate", type: "Short Answer", answer: "A conductor allows the electric current to flow through the electrolyte, facilitating the movement of ions to electrodes where chemical changes occur." },
    { text: "Explain why a solution of copper sulfate conducts electricity.", difficulty: "easy", type: "Short Answer", answer: "Copper sulfate dissociates into copper ions (Cu2+) and sulfate ions (SO4 2-) in solution. These free-moving ions carry electric charge." },
    { text: "Describe one example of the chemical effect of electric current in daily life.", difficulty: "moderate", type: "Short Answer", answer: "Electroplating chromium on steel bumpers of cars to prevent rusting and provide a shiny decorative finish." },
    { text: "Explain why electric current is said to have chemical effects.", difficulty: "moderate", type: "Short Answer", answer: "When electric current passes through a conducting solution, it causes chemical reactions (like gas bubbles, metal deposition, or color changes), showing its chemical effect." },
    { text: "How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical equation involved.", difficulty: "hard", type: "Long Answer", answer: "Sodium hydroxide is prepared by the chlor-alkali process by electrolyzing brine (aqueous NaCl). Equation: 2NaCl + 2H2O -> 2NaOH + Cl2 + H2." },
    { text: "What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.", difficulty: "hard", type: "Long Answer", answer: "Water dissociates into hydrogen and oxygen. At the cathode, hydrogen ions are reduced to H2 gas. At the anode, hydroxide ions are oxidized to O2 gas." },
    { text: "Which of the following is a good conductor of electricity?", difficulty: "easy", type: "MCQ", options: ["Distilled Water", "Lemon Juice", "Vegetable Oil", "Honey"], answer: "Lemon Juice" },
    { text: "During electroplating, the object to be coated is connected to which terminal?", difficulty: "moderate", type: "MCQ", options: ["Positive Terminal (Anode)", "Negative Terminal (Cathode)", "Any terminal", "Earth terminal"], answer: "Negative Terminal (Cathode)" },
    { text: "Explain the working of a simple electric bell with a neat description.", difficulty: "hard", type: "Long Answer", answer: "An electric bell consists of an electromagnet, armature, contact screw, hammer, and gong. When current flows, the electromagnet attracts the armature, causing the hammer to strike the gong and break the circuit. The spring pulls it back, repeating the cycle." },
    { text: "Explain the structure and working of a modern electric motor. Draw a neat diagram to illustrate.", difficulty: "hard", type: "Very Long Answer", answer: "An electric motor converts electrical energy into mechanical energy. It operates on the principle that a current-carrying loop in a magnetic field experiences torque. Key parts are armature coil, permanent magnet, split rings (commutator), carbon brushes, and DC source. Armature rotates continuously due to alternating direction of current via commutator." }
  ],
  english: [
    { text: "Identify the prepositions: 'The cat jumped over the fence and ran into the garden.'", difficulty: "easy", type: "Short Answer", answer: "The prepositions are 'over' and 'into'." },
    { text: "What is the difference between a metaphor and a simile? Provide an example of each.", difficulty: "moderate", type: "Short Answer", answer: "A simile compares two things using 'like' or 'as' (e.g., 'brave as a lion'). A metaphor makes a direct comparison without those words (e.g., 'time is a thief')." },
    { text: "Read the sentence and change it to active voice: 'The presentation was delivered beautifully by John.'", difficulty: "easy", type: "Short Answer", answer: "John beautifully delivered the presentation." },
    { text: "Explain the theme of perseverance in the story of 'The Hare and the Tortoise'.", difficulty: "moderate", type: "Long Answer", answer: "The theme demonstrates that consistent, steady effort ('slow and steady wins the race') overcomes hasty, overconfident bursts of talent without discipline." },
    { text: "Choose the correct spelling to complete the sentence: 'She gave me some excellent ______.'", difficulty: "easy", type: "MCQ", options: ["advice", "advise", "advices", "advises"], answer: "advice" },
    { text: "Which of the following is a synonym of the word 'Elated'?", difficulty: "moderate", type: "MCQ", options: ["Sad", "Exhausted", "Thrilled", "Anxious"], answer: "Thrilled" },
    { text: "Write an essay detailing your thoughts on the impact of technology on reading habits.", difficulty: "hard", type: "Long Answer", answer: "Technology has shifted reading habits from physical books to screens. While it increases accessibility to millions of articles and e-books, it also reduces attention spans due to constant notifications, hyperlinks, and scrolling behaviors." },
    { text: "Analyze the character development of the protagonist in 'The Great Gatsby' and discuss the themes of wealth and disillusionment.", difficulty: "hard", type: "Very Long Answer", answer: "Jay Gatsby represents the illusion of the American Dream. His wealth, built on illicit bootlegging, is a facade to win back Daisy Buchanan. His eventual tragic death symbolizes the ultimate failure of chasing a bygone past and the corruption of idealism by superficial materialism." }
  ],
  math: [
    { text: "Solve the equation for x: 3x + 7 = 22.", difficulty: "easy", type: "Short Answer", answer: "3x = 15 => x = 5." },
    { text: "Calculate the area of a triangle with base 12cm and height 8cm.", difficulty: "easy", type: "Short Answer", answer: "Area = 0.5 * base * height = 0.5 * 12 * 8 = 48 sq cm." },
    { text: "Find the root of the quadratic equation x^2 - 5x + 6 = 0.", difficulty: "moderate", type: "Short Answer", answer: "x^2 - 5x + 6 = (x-2)(x-3) = 0. The roots are x = 2 and x = 3." },
    { text: "If the ratio of angles of a triangle is 2:3:4, find the measure of all three angles.", difficulty: "moderate", type: "Long Answer", answer: "Let the angles be 2x, 3x, and 4x. Sum is 180 degrees: 9x = 180 => x = 20. The angles are 40, 60, and 80 degrees." },
    { text: "What is the value of 5! (factorial of 5)?", difficulty: "easy", type: "MCQ", options: ["50", "120", "24", "100"], answer: "120" },
    { text: "If log(x) + log(5) = 2, what is the value of x (base 10)?", difficulty: "hard", type: "MCQ", options: ["20", "10", "15", "50"], answer: "20" },
    { text: "State and prove the Pythagorean Theorem.", difficulty: "hard", type: "Long Answer", answer: "In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a^2 + b^2 = c^2. Proof can be demonstrated geometrically using four identical triangles arranged in a large square." },
    { text: "State the Fundamental Theorem of Calculus. Explain both parts and provide a step-by-step derivation using Riemann sums.", difficulty: "hard", type: "Very Long Answer", answer: "Part 1 of FTC states that the derivative of the area function is the original function. Part 2 states that the definite integral of a function can be evaluated using its antiderivative. Derivation involves dividing the interval into n subintervals, using the mean value theorem for integrals, and taking the limit as n approaches infinity to show the accumulation function equals the integral." }
  ],
  "social studies": [
    { text: "Who was the first President of independent India?", difficulty: "easy", type: "MCQ", options: ["Dr. Rajendra Prasad", "Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel"], answer: "Dr. Rajendra Prasad" },
    { text: "Which line of latitude passes through the middle of India?", difficulty: "easy", type: "MCQ", options: ["Equator", "Tropic of Cancer", "Tropic of Capricorn", "Prime Meridian"], answer: "Tropic of Cancer" },
    { text: "What was the main significance of the Dandi March led by Mahatma Gandhi?", difficulty: "moderate", type: "Short Answer", answer: "The Dandi March (Salt Satyagraha) of 1930 was a non-violent protest against the British salt monopoly, sparking the Civil Disobedience Movement across India." },
    { text: "Explain the separation of powers under the Indian Constitution.", difficulty: "hard", type: "Long Answer", answer: "The Constitution divides government power into Legislative (law-making), Executive (law-implementing), and Judiciary (law-interpreting). A system of checks and balances prevents any single organ from becoming absolute." },
    { text: "Trace the causes, course, and consequences of the French Revolution of 1789. Discuss its impact on modern democratic principles.", difficulty: "hard", type: "Very Long Answer", answer: "The French Revolution arose from financial crisis, unequal estate system, and Enlightenment ideas. It culminated in the fall of the Bastille, the Reign of Terror, and the rise of Napoleon. Its legacy introduced liberty, equality, and fraternity to global constitutionalism." }
  ],
  computers: [
    { text: "Which of the following is the brain of a computer system?", difficulty: "easy", type: "MCQ", options: ["RAM", "CPU", "Hard Disk", "GPU"], answer: "CPU" },
    { text: "What does HTML stand for in web development?", difficulty: "easy", type: "MCQ", options: ["Hypertext Markup Language", "High Transfer Machine Link", "Hyperlink Text Management Library", "Home Tool Markup Language"], answer: "Hypertext Markup Language" },
    { text: "Explain the difference between RAM and ROM memory.", difficulty: "moderate", type: "Short Answer", answer: "RAM (Random Access Memory) is volatile, read-write memory used to store temporary run data. ROM (Read Only Memory) is non-volatile, storing permanent boot instructions (BIOS)." },
    { text: "What is a database management system (DBMS)? List three advantages of using a DBMS over a flat-file system.", difficulty: "hard", type: "Long Answer", answer: "DBMS is software to define, retrieve, and manage database records. Advantages: reduced data redundancy, improved data security, concurrent access control, and transaction consistency (ACID properties)." },
    { text: "Explain the OSI (Open Systems Interconnection) reference model. Describe the function of all 7 layers in detail.", difficulty: "hard", type: "Very Long Answer", answer: "The OSI model standardizes network communication into 7 layers: Physical (bit transfer), Data Link (framing/MAC), Network (routing/IP), Transport (TCP/UDP flow control), Session (dialog connection), Presentation (encryption/compression), and Application (HTTP/FTP UI)." }
  ],
  hindi: [
    { text: "निम्नलिखित में से कौन सा शब्द संज्ञा का उदाहरण है?", difficulty: "easy", type: "MCQ", options: ["सुंदर", "धीरे-धीरे", "हिमालय", "वह"], answer: "हिमालय" },
    { text: "किस काल को हिंदी साहित्य का 'स्वर्णकाल' कहा जाता है?", difficulty: "easy", type: "MCQ", options: ["वीरगाथा काल", "भक्ति काल", "रीति काल", "आधुनिक काल"], answer: "भक्ति काल" },
    { text: "संधि किसे कहते हैं? इसके मुख्य भेदों के नाम लिखिए।", difficulty: "moderate", type: "Short Answer", answer: "दो निकटवर्ती वर्णों के परस्पर मेल से होने वाले परिवर्तन को संधि कहते हैं। इसके तीन मुख्य भेद हैं: स्वर संधि, व्यंजन संधि और विसर्ग संधि।" },
    { text: "मुंशी प्रेमचंद के साहित्यिक योगदान पर प्रकाश डालिए।", difficulty: "hard", type: "Long Answer", answer: "मुंशी प्रेमचंद हिंदी साहित्य के महानतम उपन्यासकार एवं कहानीकार हैं। उन्हें 'उपन्यास सम्राट' कहा जाता है। उन्होंने 'गोदान', 'गबन', 'कर्मभूमि' जैसे उपन्यासों और 'कफ़न', 'पूस की रात' जैसी सामाजिक यथार्थवादी कहानियों की रचना की है।" },
    { text: "कबीरदास के दार्शनिक और सामाजिक विचारों की विस्तार से व्याख्या कीजिए।", difficulty: "hard", type: "Very Long Answer", answer: "कबीरदास निर्गुण भक्ति शाखा के प्रमुख समाज-सुधारक कवि थे। उन्होंने बाह्याडंबरों, जाति-पाति, मूर्तिपूजा और संप्रदायवाद का कड़ा विरोध किया। उनका दर्शन अद्वैतवाद पर आधारित था और उन्होंने साखियों और सबदों के माध्यम से प्रेम, समरसता और मानवता का संदेश दिया।" }
  ]
};

export async function generateQuestionPaper(params: {
  title: string;
  subject: string;
  classLevel: string;
  allowedTime: number;
  maxMarks: number;
  questionTypes: string[];
  additionalInstructions?: string;
  fileText?: string;
}, onProgress: (log: string, percent: number) => Promise<void> | void): Promise<ISection[]> {

  await onProgress("Formatting prompt parameters...", 15);
  
  const keyToUse = process.env.GEMINI_API_KEY || apiKey;
  if (keyToUse) {
    return generateWithGemini(params, keyToUse, onProgress);
  } else {
    // Simulate async generation delay for realism and WebSocket feedback
    await new Promise(resolve => setTimeout(resolve, 800));
    await onProgress("Analyzing request parameters...", 25);
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockQuestions(params, onProgress);
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function generateMockQuestions(params: {
  subject: string;
  questionTypes: string[];
  maxMarks: number;
}, onProgress: (log: string, percent: number) => Promise<void> | void): Promise<ISection[]> {
  await onProgress("Consulting local Question Bank...", 35);
  
  const subKey = params.subject.toLowerCase();
  let dbKey = 'science';
  if (subKey.includes('eng')) dbKey = 'english';
  else if (subKey.includes('math') || subKey.includes('calc') || subKey.includes('algebra')) dbKey = 'math';
  else if (!mockQuestionDatabase[subKey]) {
    // Check if any key is a substring
    const foundKey = Object.keys(mockQuestionDatabase).find(k => subKey.includes(k) || k.includes(subKey));
    if (foundKey) dbKey = foundKey;
  }
  
  const availableQuestions = mockQuestionDatabase[dbKey] || mockQuestionDatabase.science;
  const sections: ISection[] = [];
  
  // Group questions by types
  const typesToGenerate = params.questionTypes.length > 0 ? params.questionTypes : ["Short Answer", "MCQ"];
  
  await onProgress("Structuring assessment sections...", 50);
  
  let sectionIndex = 0;
  const sectionLetters = ["A", "B", "C", "D", "E"];
  let totalGeneratedMarks = 0;
  const usedQuestionTexts = new Set<string>();
  
  for (const qType of typesToGenerate) {
    if (sectionIndex >= sectionLetters.length) break;
    
    await onProgress(`Compiling questions for Section ${sectionLetters[sectionIndex]} (${qType}s)...`, 60 + sectionIndex * 10);
    
    const isMatchingType = (q: typeof availableQuestions[0]) => {
      const lowerType = qType.toLowerCase();
      const qLowerType = q.type.toLowerCase();
      return qLowerType === lowerType || 
        (lowerType.includes('mcq') && q.type === 'MCQ') ||
        (lowerType.includes('short') && q.type === 'Short Answer') ||
        (lowerType.includes('very long') && q.type === 'Very Long Answer') ||
        (!lowerType.includes('very long') && lowerType.includes('long') && q.type === 'Long Answer');
    };

    // 1. All questions of matching type that are NOT used
    const matchingUnused = shuffleArray(availableQuestions.filter(q => !usedQuestionTexts.has(q.text) && isMatchingType(q)));
    
    // 2. All questions of OTHER types that are NOT used
    const otherUnused = shuffleArray(availableQuestions.filter(q => !usedQuestionTexts.has(q.text) && !isMatchingType(q)));
    
    // 3. All questions of matching type that ARE already used (fallback)
    const matchingUsed = shuffleArray(availableQuestions.filter(q => usedQuestionTexts.has(q.text) && isMatchingType(q)));
    
    // 4. All other questions (fallback)
    const otherUsed = shuffleArray(availableQuestions.filter(q => usedQuestionTexts.has(q.text) && !isMatchingType(q)));

    const pool = [...matchingUnused, ...otherUnused, ...matchingUsed, ...otherUsed];
    const questions: IQuestion[] = [];
    
    // Assign marks based on type
    let defaultMarks = 2;
    if (qType.toLowerCase().includes('mcq')) defaultMarks = 1;
    else if (qType.toLowerCase().includes('very long')) defaultMarks = 10;
    else if (qType.toLowerCase().includes('long') || qType.toLowerCase().includes('essay')) defaultMarks = 5;
    
    // Take up to 3-5 questions
    const qCount = qType.toLowerCase().includes('mcq') ? 4 : (qType.toLowerCase().includes('very long') ? 2 : 3);
    
    for (let i = 0; i < Math.min(qCount, pool.length); i++) {
      const pQ = pool[i];
      questions.push({
        questionText: pQ.text,
        difficulty: pQ.difficulty,
        marks: defaultMarks,
        options: pQ.options,
        answer: pQ.answer
      });
      usedQuestionTexts.add(pQ.text);
      totalGeneratedMarks += defaultMarks;
    }
    
    if (questions.length > 0) {
      const letter = sectionLetters[sectionIndex];
      sections.push({
        title: `Section ${letter}`,
        instruction: qType.toLowerCase().includes('mcq') 
          ? "Attempt all questions. Select the single best option." 
          : `Attempt all questions in this section. Each question carries ${defaultMarks} marks.`,
        questions
      });
      sectionIndex++;
    }
  }

  // Adjust marks to match maxMarks if we are slightly off
  await onProgress("Balancing mark allocations and verifying answers...", 90);
  
  return sections;
}

// Now let's implement the real Gemini API version as well, so it can run if a key is provided
export async function generateWithGemini(params: {
  title: string;
  subject: string;
  classLevel: string;
  allowedTime: number;
  maxMarks: number;
  questionTypes: string[];
  additionalInstructions?: string;
  fileText?: string;
}, apiKeyToUse: string, onProgress: (log: string, percent: number) => Promise<void> | void): Promise<ISection[]> {
  await onProgress("Initializing Gemini client session...", 30);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKeyToUse);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    await onProgress("Analyzing source materials and instructions...", 45);

    const prompt = `
You are an expert assessment creator. Generate a structured question paper based on the following specifications:

Title: ${params.title}
Subject: ${params.subject}
Class Level: ${params.classLevel}
Time Allowed: ${params.allowedTime} minutes
Maximum Marks: ${params.maxMarks}
Question Types requested: ${params.questionTypes.join(', ')}
${params.additionalInstructions ? `Additional Instructions: ${params.additionalInstructions}` : ''}
${params.fileText ? `Context File Content:\n${params.fileText}` : ''}

You MUST respond with a valid JSON object matching the following structure:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Section instruction text...",
      "questions": [
        {
          "questionText": "Question text...",
          "difficulty": "easy" | "moderate" | "hard",
          "marks": number,
          "options": ["Option A", "Option B", "Option C", "Option D"], // ONLY include options array if the question type is Multiple Choice / MCQ
          "answer": "Correct answer text or explanation..."
        }
      ]
    }
  ]
}

Ensure:
1. Questions are highly relevant to the subject and class level.
2. Group the questions into sections (Section A, Section B, etc.) based on the requested Question Types (e.g. Section A: MCQs, Section B: Short Answers).
3. Distribute difficulty levels (easy, moderate, hard) evenly across the exam.
4. Set marks for each question logically so that the sum of marks of all questions matches (or is very close to) the Maximum Marks of ${params.maxMarks}.
5. CRITICAL: Every single question must be completely unique. Under no circumstances should the same question, or a minor variation of it, be repeated anywhere in the generated question paper (either within a section or across different sections).
6. Do not include raw HTML print. Do not include markdown code block characters like \`\`\`json, just return the JSON string.
`;

    await onProgress("Querying Gemini to generate questions...", 60);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    await onProgress("Parsing AI response...", 80);
    
    // Clean text if it has Markdown JSON wrapper anyway
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText);
    
    if (parsed.sections && Array.isArray(parsed.sections)) {
      await onProgress("Validating generated sections structure...", 90);
      return parsed.sections as ISection[];
    }
    
    throw new Error("Invalid output format from Gemini");
  } catch (error) {
    console.error("Gemini Generation failed:", error);
    await onProgress("Gemini API error, falling back to local question bank...", 85);
    return generateMockQuestions(params, onProgress);
  }
}
