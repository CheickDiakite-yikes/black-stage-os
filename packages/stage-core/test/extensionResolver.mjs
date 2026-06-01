export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (
      error?.code !== "ERR_MODULE_NOT_FOUND" &&
      error?.code !== "ERR_UNSUPPORTED_DIR_IMPORT"
    ) {
      throw error;
    }

    if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
      throw error;
    }

    for (const candidate of [`${specifier}.js`, `${specifier}/index.js`]) {
      try {
        return await defaultResolve(candidate, context, defaultResolve);
      } catch {
        // Keep trying the remaining extension candidates.
      }
    }

    throw error;
  }
}
