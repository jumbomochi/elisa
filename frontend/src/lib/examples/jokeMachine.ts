import type { ExampleNugget } from './index';

export const jokeMachine: ExampleNugget = {
  id: 'joke-machine',
  name: 'Joke Machine',
  description: 'A website that tells random jokes — click for a new one!',
  category: 'web',
  difficulty: 1,
  color: 'bg-yellow-100',
  accentColor: 'text-yellow-700',
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'nugget_goal',
          x: 30,
          y: 30,
          fields: { GOAL_TEXT: 'A website that tells random jokes' },
          next: {
            block: {
              type: 'nugget_template',
              fields: { TEMPLATE_TYPE: 'website' },
              next: {
                block: {
                  type: 'feature',
                  fields: { FEATURE_TEXT: 'show a random joke on the page' },
                  next: {
                    block: {
                      type: 'feature',
                      fields: { FEATURE_TEXT: 'a button that shows a new random joke when clicked' },
                      next: {
                        block: {
                          type: 'look_like',
                          fields: { STYLE_TEXT: 'fun and playful with big text and bright colors' },
                          next: {
                            block: {
                              type: 'deploy_web',
                              fields: {},
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
  skills: [],
  rules: [],
  portals: [],
};
