import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * WeatherTool: A dummy implementation of a tool that fetches the weather for a specific city.
 */
export const weatherTool: DynamicStructuredTool = tool(
  // 1. The Logic (Doer): What happens when the tool runs? This is the function that will be called when the tool is used.
  async ({ city }: { city: string }) => {
    console.log(`--- Tool Executing: Fetching weather for ${city} ---`);

    // Dummy logic to simulate an API call
    const temperatures: Record<string, { temp: number; forecast: string }> = {
      'new york': { temp: 15, forecast: 'Partly cloudy with a chance of rain.' },
      london: { temp: 10, forecast: 'Foggy morning, clearing by afternoon.' },
      tokyo: { temp: 22, forecast: 'Sunny and clear skies.' },
      dubai: { temp: 35, forecast: 'Hot and humid.' },
    };

    const cityLower = city.toLowerCase();
    const data = temperatures[cityLower] || {
      temp: 20,
      forecast: 'Mild weather with scattered clouds.',
    };

    return `The current temperature in ${city} is ${data.temp}°C. Forecast: ${data.forecast}`;
  },
  // 2. The Metadata (Manual): How does the AI know to use this?
  {
    name: 'get_weather',
    description: 'Get the current temperature and weather forecast for a specific city.',
    schema: z.object({
      city: z.string().describe("The name of the city, e.g., 'New York' or 'London'"),
    }),
  },
);
