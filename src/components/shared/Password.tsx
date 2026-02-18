import React from "react";

// 로그인 로직 제거 - 항상 허용
export default function PasswordCheckModal({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  React.useEffect(() => {
    if (onSuccess) onSuccess();
  }, [onSuccess]);

  return null;
}
