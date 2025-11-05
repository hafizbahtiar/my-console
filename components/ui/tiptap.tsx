"use client";

import "./tiptap.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlock from "@tiptap/extension-code-block";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Mathematics from "@tiptap/extension-mathematics";
import CharacterCount from "@tiptap/extension-character-count";
import { TextStyle, FontFamily } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Strike } from "@tiptap/extension-strike";
import { TextAlign } from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Emoji from "@tiptap/extension-emoji";
import Mention from "@tiptap/extension-mention";
import { TableOfContents } from "@tiptap/extension-table-of-contents";
import HardBreak from "@tiptap/extension-hard-break";
import Typography from "@tiptap/extension-typography";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Table as TableIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Calculator,
  Palette,
  Highlighter,
  Type,
  Plus,
  Rows,
  Minus,
  Trash2,
  Underline as UnderlineIcon,
  Strikethrough,
  ListChecks,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface TipTapProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readonly?: boolean;
  stickyTop?: string;
}

export function TipTap({ value, onChange, placeholder, className, readonly = false, stickyTop = "top-0" }: TipTapProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
  const [tocContent, setTocContent] = useState<any[]>([]);

  // Predefined color options
  const colorOptions = [
    { value: "#000000", label: "Black", color: "#000000" },
    { value: "#374151", label: "Gray", color: "#374151" },
    { value: "#dc2626", label: "Red", color: "#dc2626" },
    { value: "#ea580c", label: "Orange", color: "#ea580c" },
    { value: "#ca8a04", label: "Yellow", color: "#ca8a04" },
    { value: "#16a34a", label: "Green", color: "#16a34a" },
    { value: "#0891b2", label: "Cyan", color: "#0891b2" },
    { value: "#2563eb", label: "Blue", color: "#2563eb" },
    { value: "#7c3aed", label: "Violet", color: "#7c3aed" },
    { value: "#c026d3", label: "Magenta", color: "#c026d3" },
    { value: "#be123c", label: "Rose", color: "#be123c" },
  ];

  // Predefined highlight colors
  const highlightOptions = [
    { value: "#fef3c7", label: "Yellow", color: "#fef3c7" },
    { value: "#dbeafe", label: "Blue", color: "#dbeafe" },
    { value: "#dcfce7", label: "Green", color: "#dcfce7" },
    { value: "#fee2e2", label: "Red", color: "#fee2e2" },
    { value: "#f3e8ff", label: "Purple", color: "#f3e8ff" },
    { value: "#fffbeb", label: "Amber", color: "#fffbeb" },
    { value: "#ecfdf5", label: "Emerald", color: "#ecfdf5" },
    { value: "#f0f9ff", label: "Sky", color: "#f0f9ff" },
  ];

  // Font size options
  const fontSizeOptions = [
    { value: "12px", label: "12px" },
    { value: "14px", label: "14px" },
    { value: "16px", label: "16px" },
    { value: "18px", label: "18px" },
    { value: "20px", label: "20px" },
    { value: "24px", label: "24px" },
    { value: "28px", label: "28px" },
    { value: "32px", label: "32px" },
    { value: "36px", label: "36px" },
    { value: "48px", label: "48px" },
  ];

  // Font family options
  const fontFamilyOptions = [
    { value: "Arial", label: "Arial", style: "font-family: Arial" },
    { value: "Helvetica", label: "Helvetica", style: "font-family: Helvetica" },
    { value: "Times New Roman", label: "Times New Roman", style: "font-family: 'Times New Roman'" },
    { value: "Georgia", label: "Georgia", style: "font-family: Georgia" },
    { value: "Verdana", label: "Verdana", style: "font-family: Verdana" },
    { value: "Courier New", label: "Courier New", style: "font-family: 'Courier New'" },
    { value: "Trebuchet MS", label: "Trebuchet MS", style: "font-family: 'Trebuchet MS'" },
    { value: "Impact", label: "Impact", style: "font-family: Impact" },
    { value: "Comic Sans MS", label: "Comic Sans MS", style: "font-family: 'Comic Sans MS'" },
  ];

  // LaTeX math expressions
  const mathExpressions = [
    // Basic operations
    { label: "Addition", latex: "a + b", description: "a + b" },
    { label: "Subtraction", latex: "a - b", description: "a - b" },
    { label: "Multiplication", latex: "a \\times b", description: "a × b" },
    { label: "Division", latex: "\\frac{a}{b}", description: "a/b" },
    { label: "Power", latex: "a^{b}", description: "a^b" },
    { label: "Square Root", latex: "\\sqrt{x}", description: "√x" },
    { label: "nth Root", latex: "\\sqrt[n]{x}", description: "ⁿ√x" },

    // Fractions and equations
    { label: "Fraction", latex: "\\frac{numerator}{denominator}", description: "numerator/denominator" },
    { label: "Equality", latex: "a = b", description: "a = b" },
    { label: "Inequality", latex: "a \\neq b", description: "a ≠ b" },
    { label: "Less than", latex: "a < b", description: "a < b" },
    { label: "Greater than", latex: "a > b", description: "a > b" },

    // Greek letters
    { label: "Alpha", latex: "\\alpha", description: "α" },
    { label: "Beta", latex: "\\beta", description: "β" },
    { label: "Gamma", latex: "\\gamma", description: "γ" },
    { label: "Delta", latex: "\\delta", description: "δ" },
    { label: "Theta", latex: "\\theta", description: "θ" },
    { label: "Pi", latex: "\\pi", description: "π" },
    { label: "Sigma", latex: "\\sigma", description: "σ" },

    // Calculus
    { label: "Integral", latex: "\\int", description: "∫" },
    { label: "Derivative", latex: "\\frac{d}{dx}", description: "d/dx" },
    { label: "Partial Derivative", latex: "\\frac{\\partial}{\\partial x}", description: "∂/∂x" },
    { label: "Limit", latex: "\\lim_{x \\to a}", description: "lim x→a" },

    // Advanced
    { label: "Sum", latex: "\\sum_{i=1}^{n}", description: "Σ i=1 to n" },
    { label: "Product", latex: "\\prod_{i=1}^{n}", description: "∏ i=1 to n" },
    { label: "Matrix 2x2", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", description: "2×2 matrix" },
    { label: "Vector", latex: "\\vec{v}", description: "→v" },

    // Custom input option
    { label: "Custom LaTeX...", latex: "custom", description: "Enter custom LaTeX" },
  ];

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      CodeBlock.configure({
        languageClassPrefix: "language-",
        HTMLAttributes: {
          class: "rounded-md bg-muted p-4 font-mono text-sm",
        },
      }),
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: {
            class: "border-collapse table-auto w-full",
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        controls: true,
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
      CharacterCount,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          return "Start writing...";
        },
      }),
      Emoji,
      TableOfContents.configure({
        getId: (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        onUpdate: (content) => {
          setTocContent(content);
        },
      }),
      HardBreak,
      Typography,
      Mention.configure({
        HTMLAttributes: {
          class: "bg-blue-100 text-blue-800 px-2 py-1 rounded",
        },
        suggestion: {
          // This would need a proper suggestion implementation
          // For now, we'll keep it simple
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !readonly,
    editorProps: {
      attributes: {
        class: cn(
          "prose focus:outline-none min-h-[200px] p-4",
          readonly && "cursor-default",
          className
        ),
      },
      handleKeyDown: (view, event) => {
        // Custom keyboard shortcuts
        if ((event.ctrlKey || event.metaKey) && editor) {
          if (event.shiftKey) {
            // Ctrl+Shift shortcuts for text alignment and highlighting
            switch (event.key) {
              case 'L':
              case 'l':
                event.preventDefault();
                editor.chain().focus().setTextAlign('left').run();
                return true;
              case 'E':
              case 'e':
                event.preventDefault();
                editor.chain().focus().setTextAlign('center').run();
                return true;
              case 'R':
              case 'r':
                event.preventDefault();
                editor.chain().focus().setTextAlign('right').run();
                return true;
              case 'J':
              case 'j':
                event.preventDefault();
                editor.chain().focus().setTextAlign('justify').run();
                return true;
              case 'H':
              case 'h':
                event.preventDefault();
                editor.chain().focus().toggleHighlight().run();
                return true;
            }
          } else {
            // Regular Ctrl shortcuts
            switch (event.key) {
              case 'b':
                event.preventDefault();
                editor.chain().focus().toggleBold().run();
                return true;
              case 'i':
                event.preventDefault();
                editor.chain().focus().toggleItalic().run();
                return true;
              case 'u':
                event.preventDefault();
                editor.chain().focus().toggleUnderline().run();
                return true;
              case 'z':
                event.preventDefault();
                editor.chain().focus().undo().run();
                return true;
              case 'y':
                event.preventDefault();
                editor.chain().focus().redo().run();
                return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Initialize table of contents when editor is ready
  useEffect(() => {
    if (editor) {
      // Get initial TOC content
      const initialToc = editor.storage.tableOfContents?.content || [];
      setTocContent(initialToc);
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const addYoutubeVideo = useCallback(() => {
    const url = prompt("Enter YouTube URL:");
    if (url && editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  const addMathBlock = useCallback((latex?: string) => {
    if (!editor) return;

    let finalLatex = latex;

    if (!latex || latex === "custom") {
      const customLatex = prompt("Enter LaTeX math expression:", latex === "custom" ? "" : latex);
      if (customLatex) {
        finalLatex = customLatex;
      } else {
        return; // User cancelled
      }
    }

    if (finalLatex) {
      editor.chain().focus().insertContent(`<div data-type="math">${finalLatex}</div>`).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(
      "border border-input rounded-lg shadow-sm bg-background relative",
      showTableOfContents && "toc-open-layout"
    )}>
      {!readonly && (
        <DragHandle
          editor={editor}
          onNodeChange={({ node, editor, pos }: { node: any; editor: any; pos: number }) => {
            // Optional: Handle node changes for highlighting or other effects
            console.log('Node changed:', node?.type.name, pos);
          }}
          computePositionConfig={{
            placement: 'left-start',
            strategy: 'absolute',
          }}
        >
          <div className="drag-handle">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </DragHandle>
      )}

      {!readonly && (

        <div className={cn("sticky z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm", stickyTop)}>
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Rich Text Editor</span>
              <div className="flex items-center gap-2">
                {editor?.isActive("table") && (
                  <Badge variant="outline" className="text-xs">
                    Table Mode - Click cells to edit
                  </Badge>
                )}
                {editor?.isActive("codeBlock") && (
                  <Badge variant="outline" className="text-xs">
                    Code Block
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{editor?.storage.characterCount?.characters() || 0} chars</span>
              <span>{editor?.storage.characterCount?.words() || 0} words</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className={cn(
                  "h-6 w-6 p-0 ml-2",
                  showTableOfContents && "bg-accent"
                )}
                title="Toggle Table of Contents"
              >
                <ListChecks className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-3 bg-background border-t">
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Access Buttons */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor?.can().undo()}
                className="h-8 w-8 p-0"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor?.can().redo()}
                className="h-8 w-8 p-0"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-8" />

              {/* Advanced Formatting Menu */}
              <Menubar className="tiptap-menubar">
                <MenubarMenu>
                  <MenubarTrigger className="h-8 px-2 text-xs font-medium">
                    Format
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={() => editor.chain().focus().toggleBold().run()}>
                      <Bold className="h-4 w-4 mr-2" />
                      Bold
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+B</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleItalic().run()}>
                      <Italic className="h-4 w-4 mr-2" />
                      Italic
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+I</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleUnderline().run()}>
                      <UnderlineIcon className="h-4 w-4 mr-2" />
                      Underline
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+U</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleStrike().run()}>
                      <Strikethrough className="h-4 w-4 mr-2" />
                      Strikethrough
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleHighlight().run()}>
                      <Highlighter className="h-4 w-4 mr-2" />
                      Highlight
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+H</span>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                      <Heading1 className="h-4 w-4 mr-2" />
                      Heading 1
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                      <Heading2 className="h-4 w-4 mr-2" />
                      Heading 2
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                      <Heading3 className="h-4 w-4 mr-2" />
                      Heading 3
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
                      <List className="h-4 w-4 mr-2" />
                      Bullet List
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                      <ListOrdered className="h-4 w-4 mr-2" />
                      Numbered List
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                      <Quote className="h-4 w-4 mr-2" />
                      Blockquote
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                      <AlignLeft className="h-4 w-4 mr-2" />
                      Align Left
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+L</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                      <AlignCenter className="h-4 w-4 mr-2" />
                      Align Center
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+E</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                      <AlignRight className="h-4 w-4 mr-2" />
                      Align Right
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+R</span>
                    </MenubarItem>
                    <MenubarItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                      <AlignJustify className="h-4 w-4 mr-2" />
                      Justify
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+J</span>
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>

              {/* Insert Menu */}
              <Menubar className="tiptap-menubar">
                <MenubarMenu>
                  <MenubarTrigger className="h-8 px-2 text-xs font-medium">
                    Insert
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={addTable}>
                      <TableIcon className="h-4 w-4 mr-2" />
                      Table
                    </MenubarItem>
                    <MenubarItem onClick={addImage}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </MenubarItem>
                    <MenubarItem onClick={addYoutubeVideo}>
                      <YoutubeIcon className="h-4 w-4 mr-2" />
                      YouTube Video
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                      <Code className="h-4 w-4 mr-2" />
                      Code Block
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>

              {/* Text Styling */}
              <Popover open={colorOpen} onOpenChange={setColorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Text Color"
                    className="h-8 w-8 p-0"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search color..." />
                    <CommandList>
                      <CommandEmpty>No color found.</CommandEmpty>
                      <CommandGroup>
                        {colorOptions.map((color) => (
                          <CommandItem
                            key={color.value}
                            value={color.value}
                            onSelect={(value) => {
                              if (editor) {
                                editor.chain().focus().setColor(value).run();
                              }
                              setColorOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border border-border"
                                style={{ backgroundColor: color.color }}
                              />
                              {color.label}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Highlight Text (Ctrl+Shift+H)"
                    className="h-8 w-8 p-0"
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search highlight..." />
                    <CommandList>
                      <CommandEmpty>No highlight found.</CommandEmpty>
                      <CommandGroup>
                        {highlightOptions.map((highlight) => (
                          <CommandItem
                            key={highlight.value}
                            value={highlight.value}
                            onSelect={(value) => {
                              if (editor) {
                                editor.chain().focus().toggleHighlight({ color: value }).run();
                              }
                              setHighlightOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border border-border"
                                style={{ backgroundColor: highlight.color }}
                              />
                              {highlight.label}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Popover open={fontSizeOpen} onOpenChange={setFontSizeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Font Size"
                    className="h-8 w-8 p-0"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[120px] p-0">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {fontSizeOptions.map((size) => (
                          <CommandItem
                            key={size.value}
                            value={size.value}
                            onSelect={(value) => {
                              if (editor) {
                                editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
                              }
                              setFontSizeOpen(false);
                            }}
                          >
                            <span style={{ fontSize: size.value }}>{size.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Font Family Selector */}
              <Popover open={fontFamilyOpen} onOpenChange={setFontFamilyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Font Family"
                    className="h-8 w-8 p-0"
                  >
                    <span className="text-xs font-bold">Aa</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search fonts..." />
                    <CommandList>
                      <CommandEmpty>No font found.</CommandEmpty>
                      <CommandGroup>
                        {fontFamilyOptions.map((font) => (
                          <CommandItem
                            key={font.value}
                            value={font.label}
                            onSelect={(value) => {
                              if (editor) {
                                editor.chain().focus().setFontFamily(font.value).run();
                              }
                              setFontFamilyOpen(false);
                            }}
                          >
                            <span style={{ fontFamily: font.style.split(':')[1] }}>
                              {font.label}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Separator orientation="vertical" className="h-8" />

              {/* Math Expression Selector */}
              <Popover open={mathOpen} onOpenChange={setMathOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Insert Math Formula"
                    className="h-8 w-8 p-0"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search math expressions..." />
                    <CommandList>
                      <CommandEmpty>No math expressions found.</CommandEmpty>
                      <CommandGroup heading="Basic Operations">
                        {mathExpressions.filter(expr => ["Addition", "Subtraction", "Multiplication", "Division", "Power", "Square Root", "nth Root", "Fraction"].includes(expr.label)).map((expr) => (
                          <CommandItem
                            key={expr.label}
                            value={expr.label}
                            onSelect={(value) => {
                              const selected = mathExpressions.find(e => e.label === value);
                              if (selected) {
                                addMathBlock(selected.latex);
                              }
                              setMathOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{expr.label}</span>
                              <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                                {expr.description}
                              </code>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Equations & Symbols">
                        {mathExpressions.filter(expr => ["Equality", "Inequality", "Less than", "Greater than", "Alpha", "Beta", "Gamma", "Delta", "Theta", "Pi", "Sigma"].includes(expr.label)).map((expr) => (
                          <CommandItem
                            key={expr.label}
                            value={expr.label}
                            onSelect={(value) => {
                              const selected = mathExpressions.find(e => e.label === value);
                              if (selected) {
                                addMathBlock(selected.latex);
                              }
                              setMathOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{expr.label}</span>
                              <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                                {expr.description}
                              </code>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Calculus & Advanced">
                        {mathExpressions.filter(expr => ["Integral", "Derivative", "Partial Derivative", "Limit", "Sum", "Product", "Matrix 2x2", "Vector", "Custom LaTeX..."].includes(expr.label)).map((expr) => (
                          <CommandItem
                            key={expr.label}
                            value={expr.label}
                            onSelect={(value) => {
                              const selected = mathExpressions.find(e => e.label === value);
                              if (selected) {
                                addMathBlock(selected.latex);
                              }
                              setMathOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{expr.label}</span>
                              <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                                {expr.description}
                              </code>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Table Controls - Only show when table is active */}
              {editor?.isActive("table") && (
                <>
                  <div className="table-controls flex items-center gap-2 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground mr-2">Table Tools:</span>

                    {/* Column Controls */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Column</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().addColumnBefore().run()}
                        title="Add Column Left"
                        className="table-control-btn h-7 px-2 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().deleteColumn().run()}
                        title="Delete Column"
                        className="table-control-btn h-7 px-2 text-xs"
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-5" />

                    {/* Row Controls */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Row</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().addRowBefore().run()}
                        title="Add Row Above"
                        className="table-control-btn h-7 px-2 text-xs"
                      >
                        <Rows className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        title="Delete Row"
                        className="table-control-btn h-7 px-2 text-xs"
                      >
                        <Rows className="h-3 w-3 mr-1 rotate-90" />
                        Remove
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-5" />

                    {/* Table Actions */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this entire table? This action cannot be undone.')) {
                          editor.chain().focus().deleteTable().run();
                        }
                      }}
                      title="Delete Entire Table"
                      className="table-control-btn destructive h-7 px-2 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Table
                    </Button>
                  </div>

                  <Separator orientation="vertical" className="h-8" />
                </>
              )}

              <Separator orientation="vertical" className="h-8" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 w-8 p-0"
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-8 w-8 p-0"
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>
      )}

      {/* Main Content Area - Always in the same position */}
      <div className="main-content-area">
        <div className="relative">
          <EditorContent
            editor={editor}
            className={cn("min-h-[400px] px-4 py-4 focus:outline-none prose prose-sm max-w-none", readonly && "cursor-default bg-muted/20")}
          />

          {editor.isEmpty && placeholder && (
            <div className="absolute top-4 left-4 text-muted-foreground/70 pointer-events-none select-none">
              <div className="flex items-center gap-2">
                <span className="text-sm">{placeholder}</span>
                <span className="text-xs bg-muted px-2 py-1 rounded border">Start typing to begin...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table of Contents Panel - Grid column when open */}
      {showTableOfContents && (
        <div className="toc-panel w-80">
          <div className="p-4">
            <h3 className="text-sm">
              Table of Contents
            </h3>
            <div className="space-y-2">
              {tocContent && tocContent.length > 0 && (
                <nav className="toc-content">
                  {tocContent.map((item: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        const element = document.querySelector(`[data-toc-id="${item.id}"]`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={cn(
                        "toc-item block w-full text-left text-sm py-1.5 px-2 transition-colors",
                        item.level === 1 && "font-medium pl-2",
                        item.level === 2 && "ml-4 text-muted-foreground pl-4",
                        item.level === 3 && "ml-8 text-muted-foreground text-xs pl-6"
                      )}
                    >
                      {item.textContent}
                    </button>
                  ))}
                </nav>
              )}
              {(!tocContent || tocContent.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add headings (H1, H2, H3) to generate table of contents
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click the heading buttons in the toolbar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
