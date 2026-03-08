import type { ExampleNugget } from './index';

export const petNamePicker: ExampleNugget = {
  id: 'pet-name-picker',
  name: 'Pet Name Picker',
  description: 'Generate the perfect name for your pet — pick a species and get fun name ideas!',
  category: 'web',
  difficulty: 2,
  color: 'bg-green-100',
  accentColor: 'text-green-700',
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'nugget_goal',
          x: 30,
          y: 30,
          fields: { GOAL_TEXT: 'A pet name generator website' },
          next: {
            block: {
              type: 'nugget_template',
              fields: { TEMPLATE_TYPE: 'website' },
              next: {
                block: {
                  type: 'feature',
                  fields: { FEATURE_TEXT: 'let the user pick a pet type: dog, cat, hamster, or fish' },
                  next: {
                    block: {
                      type: 'feature',
                      fields: { FEATURE_TEXT: 'generate 5 creative name suggestions when a pet type is selected' },
                      next: {
                        block: {
                          type: 'feature',
                          fields: { FEATURE_TEXT: 'a button to get 5 more names' },
                          next: {
                            block: {
                              type: 'look_like',
                              fields: { STYLE_TEXT: 'cute and colorful with animal emojis and rounded cards' },
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
          },
        },
      ],
    },
  },
  skills: [],
  rules: [],
  portals: [],
};
