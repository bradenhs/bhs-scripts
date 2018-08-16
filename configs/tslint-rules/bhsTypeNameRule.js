const Lint = require("tslint");
const ts = require("typescript");

function checkTypeNodeName(node, humanReadableName, startingCharacter) {
  if (node.name.text[0] !== startingCharacter) {
    return `${humanReadableName} name must start with a capitalized '${startingCharacter}'`;
  } else if (node.name.text.length < 2) {
    return `${humanReadableName} name must be at least 2 characters long`;
  } else if (node.name.text[1] === node.name.text[1].toLowerCase()) {
    return `${humanReadableName} name must start with '${startingCharacter}' followed by a capitalized letter`;
  }

  return null;
}

const checkTypeNodeNameMap = {
  [ts.SyntaxKind.TypeParameter](node) {
    return checkTypeNodeName(node, "generic", "T");
  },
  [ts.SyntaxKind.InterfaceDeclaration](node) {
    return checkTypeNodeName(node, "interface", "T");
  },
  [ts.SyntaxKind.TypeAliasDeclaration](node) {
    return checkTypeNodeName(node, "type alias", "T");
  }
};

class Rule extends Lint.Rules.AbstractRule {
  apply(sourceFile) {
    return this.applyWithWalker(
      new TypeNameWalker(sourceFile, this.getOptions())
    );
  }
}

class TypeNameWalker extends Lint.RuleWalker {
  visitNode(node) {
    if (checkTypeNodeNameMap[node.kind]) {
      const failure = checkTypeNodeNameMap[node.kind](node);
      if (failure !== null) {
        this.addFailureAtNode(node.name, failure);
      }
    }

    super.visitNode(node);
  }
}

module.exports = { Rule };
