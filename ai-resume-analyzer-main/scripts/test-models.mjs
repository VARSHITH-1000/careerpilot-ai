import { GoogleGenerativeAI } from "@google/generative-ai";
const gen = new GoogleGenerativeAI("AIzaSyC_ERuItJkwpvLLaMjnFGiGDUMyHuGssX4");
try {
  // Wait, the SDK might not have a simple listModels, let's fetch it directly
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC_ERuItJkwpvLLaMjnFGiGDUMyHuGssX4");
  const data = await res.json();
  console.log(data.models?.map(m => m.name).join("\n") || data);
} catch(e) { console.error(e); }
