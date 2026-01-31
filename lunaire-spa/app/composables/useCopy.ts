/**
 * Composable for using centralized copy in Vue components
 *
 * Usage:
 *   const { t, style } = useCopy()
 *
 *   // In template:
 *   <h1 :style="style('home.hero.title')">{{ t('home.hero.title') }}</h1>
 */
import { computed, type CSSProperties } from "vue";
import { useCopyStore, type CopyStyle } from "~/stores/copy";

export const useCopy = () => {
  const copyStore = useCopyStore();

  /**
   * Get text content by path
   * @param path Dot-notation path like 'home.hero.title'
   */
  const t = (path: string): string => {
    return copyStore.getText(path);
  };

  /**
   * Get CSS style object by path
   * @param path Dot-notation path like 'home.hero.title'
   */
  const style = (path: string): CSSProperties => {
    const copyStyle = copyStore.getStyle(path);
    if (!copyStyle) return {};

    return {
      fontFamily: copyStyle.fontFamily,
      fontSize: copyStyle.fontSize,
      fontWeight: copyStyle.fontWeight as any,
      color: copyStyle.color,
      lineHeight: copyStyle.lineHeight,
    };
  };

  /**
   * Get both text and style for a path
   */
  const copy = (path: string) => ({
    text: t(path),
    style: style(path),
  });

  /**
   * Get all copy as flat map (for admin/editing UI)
   */
  const allCopy = computed(() => copyStore.getAllCopyFlat);

  /**
   * Update text at path
   */
  const updateText = (path: string, newText: string) => {
    copyStore.updateText(path, newText);
  };

  /**
   * Update style at path
   */
  const updateStyle = (path: string, newStyle: Partial<CopyStyle>) => {
    copyStore.updateStyle(path, newStyle);
  };

  return {
    t,
    style,
    copy,
    allCopy,
    updateText,
    updateStyle,
    exportCopy: () => copyStore.exportCopy(),
    importCopy: (json: string) => copyStore.importCopy(json),
  };
};
