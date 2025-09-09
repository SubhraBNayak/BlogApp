import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({apiKey : "AIzaSyCzsawVLJ8a3qa0a052JSsWO5nohJ3loqQ"});

export async function main(blogContent){
    const response = await ai.models.generateContent({
        model : "gemini-2.5-flash",
        contents : blogContent + "generate and send a suitable and engaging title for the given blog content. send only one best title that is engaging. don't send anything else like 'here is one best title', you should just send one string that is the title of the given content nothing else strictly."
    });
    return response;
}
