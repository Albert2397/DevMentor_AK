import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type AnyProps = Record<string, unknown> & { children?: ReactNode };
type AsyncComponent = (props: AnyProps) => Promise<ReactNode>;

function isAsyncComponent(type: unknown): type is AsyncComponent {
  return typeof type === "function" && type.constructor.name === "AsyncFunction";
}

/** Finds the first element whose component is an async Server Component with the given name. */
export function findAsyncElement(node: ReactNode, name: string): ReactElement<AnyProps> {
  const found = search(node, name);
  if (!found) throw new Error(`No async component <${name}> in the tree.`);
  return found;
}

function search(node: ReactNode, name: string): ReactElement<AnyProps> | undefined {
  if (Array.isArray(node)) {
    for (const child of node as ReactNode[]) {
      const found = search(child, name);
      if (found) return found;
    }
    return undefined;
  }
  if (!isValidElement<AnyProps>(node)) return undefined;
  if (isAsyncComponent(node.type) && node.type.name === name) return node;
  return search(node.props.children, name);
}

/** Calls an async Server Component element like the RSC renderer would and returns its output. */
export async function renderAsyncElement(element: ReactElement<AnyProps>): Promise<ReactNode> {
  if (!isAsyncComponent(element.type)) throw new Error("Not an async component element.");
  return element.type(element.props);
}

/** Replaces async Server Components with placeholders so the sync shell can be rendered in jsdom. */
export function withAsyncPlaceholders(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return (node as ReactNode[]).map(withAsyncPlaceholders);
  if (!isValidElement<AnyProps>(node)) return node;
  if (isAsyncComponent(node.type)) {
    return <div data-testid={`async:${node.type.name}`} />;
  }
  if (node.props.children === undefined) return node;
  const children = withAsyncPlaceholders(node.props.children);
  return Array.isArray(children)
    ? cloneElement(node, undefined, ...(children as ReactNode[]))
    : cloneElement(node, undefined, children);
}
