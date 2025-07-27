import { FileText, Edit, Plus, Trash2, Folder, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCallNotificationProps {
  toolName: string;
  toolInvocation: {
    state: "result" | "call";
    result?: any;
    args?: any;
  };
}

export function ToolCallNotification({ toolName, toolInvocation }: ToolCallNotificationProps) {
  const getFriendlyMessage = () => {
    switch (toolName) {
      case "str_replace_editor":
        return getStrReplaceMessage(toolInvocation);
      case "file_manager":
        return getFileManagerMessage(toolInvocation);
      default:
        return toolName;
    }
  };

  const getStrReplaceMessage = (invocation: any) => {
    const { command, path } = invocation.args || {};
    
    switch (command) {
      case "create":
        return `Creating file: ${getFileName(path)}`;
      case "str_replace":
        return `Editing: ${getFileName(path)}`;
      case "insert":
        return `Inserting into: ${getFileName(path)}`;
      case "view":
        return `Viewing: ${getFileName(path)}`;
      default:
        return `Working with: ${getFileName(path)}`;
    }
  };

  const getFileManagerMessage = (invocation: any) => {
    const { command, path } = invocation.args || {};
    
    switch (command) {
      case "createDirectory":
        return `Creating directory: ${getFileName(path)}`;
      case "createFile":
        return `Creating file: ${getFileName(path)}`;
      case "listDirectory":
        return `Listing directory: ${getFileName(path)}`;
      case "moveFile":
        const { newPath } = invocation.args || {};
        return `Moving: ${getFileName(path)} → ${getFileName(newPath)}`;
      case "deleteFile":
        return `Deleting: ${getFileName(path)}`;
      case "deleteDirectory":
        return `Deleting directory: ${getFileName(path)}`;
      default:
        return `Managing: ${getFileName(path)}`;
    }
  };

  const getFileName = (path: string) => {
    if (!path) return "file";
    return path.split("/").pop() || path;
  };

  const getIcon = () => {
    switch (toolName) {
      case "str_replace_editor":
        return getStrReplaceIcon();
      case "file_manager":
        return getFileManagerIcon();
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getStrReplaceIcon = () => {
    const { command } = toolInvocation.args || {};
    
    switch (command) {
      case "create":
        return <Plus className="h-3 w-3" />;
      case "str_replace":
      case "insert":
        return <Edit className="h-3 w-3" />;
      case "view":
        return <Eye className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getFileManagerIcon = () => {
    const { command } = toolInvocation.args || {};
    
    switch (command) {
      case "createDirectory":
        return <Folder className="h-3 w-3" />;
      case "createFile":
        return <Plus className="h-3 w-3" />;
      case "listDirectory":
        return <Eye className="h-3 w-3" />;
      case "moveFile":
        return <FileText className="h-3 w-3" />;
      case "deleteFile":
      case "deleteDirectory":
        return <Trash2 className="h-3 w-3" />;
      default:
        return <Folder className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    if (toolInvocation.state === "result") {
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    }
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const friendlyMessage = getFriendlyMessage();
  const icon = getIcon();
  const statusClasses = getStatusColor();

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border",
      statusClasses
    )}>
      {toolInvocation.state === "call" ? (
        <Loader2 data-testid="loader" className="h-3 w-3 animate-spin" />
      ) : (
        icon
      )}
      <span>{friendlyMessage}</span>
    </div>
  );
}