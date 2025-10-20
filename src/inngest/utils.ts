import { Sandbox } from "@e2b/code-interpreter";

export async function getSendbox(sandboxId:string) {
    const sandbox = await Sandbox.connect(sandboxId);
    return sandbox;
}