import { SelectableButton } from "./Game";

const AIPlayer = {
  async playTurn(
    artCategories: SelectableButton[],
    elements: SelectableButton[],
    artStyle: string,
    generateImageRight: () => Promise<void>
  ) {
    // Step 1: Wait for a short delay to simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 2: Choose 1 option for Art Categories
    const randomCategoryIndex = Math.floor(Math.random() * artCategories.length);
    artCategories[randomCategoryIndex].selected = true;

    // Step 3: Choose 5 out of 15 for Art Elements
    const randomElementIndices = this.getRandomIndices(elements.length, 5);
    randomElementIndices.forEach((index) => {
      elements[index].selected = true;
    });

    // Step 4: Click Generate Image
    await generateImageRight();
  },

  getRandomIndices(totalCount: number, selectCount: number): number[] {
    const indices: number[] = [];
    while (indices.length < selectCount) {
      const randomIndex = Math.floor(Math.random() * totalCount);
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }
    return indices;
  },
};

export default AIPlayer;
