import os

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "crypto" not in content and "timingSafeEqual" not in content:
        if filepath.endswith("api-utils.ts"):
            content = "import crypto from 'crypto';\n" + content
        elif filepath.endswith("index.ts"):
            content = "import crypto from 'crypto';\n" + content

    if "req.headers.authorization === `Bearer ${configuredToken}`" in content:
        new_logic = """  const authHeader = req.headers.authorization || '';
  const expectedHeader = `Bearer ${configuredToken}`;

  if (authHeader.length !== expectedHeader.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedHeader));"""
        content = content.replace("return req.headers.authorization === `Bearer ${configuredToken}`;", new_logic)

    if "if (authHeader !== `Bearer ${configuredToken}`)" in content:
        new_logic = """  const authHeaderStr = authHeader || '';
  const expectedHeader = `Bearer ${configuredToken}`;

  if (authHeaderStr.length !== expectedHeader.length || !crypto.timingSafeEqual(Buffer.from(authHeaderStr), Buffer.from(expectedHeader))) {
    sendError(res, 401, requestId, 'Unauthorized');
    return false;
  }"""

        old_logic = """  if (authHeader !== `Bearer ${configuredToken}`) {
    sendError(res, 401, requestId, 'Unauthorized');
    return false;
  }"""
        content = content.replace(old_logic, new_logic)

    with open(filepath, 'w') as f:
        f.write(content)


update_file('apps/api/src/index.ts')
update_file('apps/web/src/server/api-utils.ts')
