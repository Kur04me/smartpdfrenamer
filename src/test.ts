import { delay, Listr } from "listr2";

interface Ctx {
  /* some variables for internal use */
}

const tasks = new Listr<Ctx>(
  [
    {
      title: "sample.pdf",
      task: async (ctx, task): Promise<void> => {
        await delay(1000);

        task.title = "I have done stuff, but should do some more.";

        await delay(1000);

        task.title = "All the stuff has been done.";
      },
    },
  ],
  {
    /* options */
  }
);

async function test() {
  try {
    await tasks.run();
  } catch (e) {
    console.error(e);
  }
}

if (require.main === module) {
  test();
}
