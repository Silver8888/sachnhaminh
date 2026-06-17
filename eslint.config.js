import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'src/**/*'] // we only want to lint rules
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
