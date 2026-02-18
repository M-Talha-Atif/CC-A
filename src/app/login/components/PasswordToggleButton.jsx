import {   Eye,
  EyeOff,
} from "lucide-react";

const PasswordToggleButton = ({ showPassword, setShowPassword, disabled }) => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-gray-500 hover:text-gray-700 focus:outline-none"
      disabled={disabled}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

export default PasswordToggleButton;