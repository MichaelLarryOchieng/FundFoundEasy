public class switch_statement {
    public static void main(String[] args) {

        //This is a switch statement tedious to write with a lot of breaks

//        int nLetters = 0;
//        String name = "Jane";

//        switch (name) {
//            case "Jane":
//            case "Sean":
//            case "Alan":
//            case "Paul":
//                nLetters = 4;
//                break;
//
//            case "Janet":
//            case "Susan":
//                nLetters = 5;
//                break;
//
//            case "Maaike":
//            case "Alison":
//            case "Mariam":
//                nLetters = 6;
//                break;
//
//            default:
//                System.out.println("Unrecognised name"+ " "+name);
//                nLetters = -1;
//                break;
//        }
//        System.out.println(nLetters);

        //This is the code reconfigured to use a switch expression(a lot cleaner)

        int nLetters = 0;
        String name = "Jane";

        nLetters = switch (name){//Switch expression doesnt use break
            case "Jane", "Sean", "Paul", "Alan" -> 4;
            case "Janet", "Susan" -> 5;
            case "Maaike", "Alison", "Miriam" ->6;
            default -> {
                System.out.println("Unrecognised name"+ " "+ name);
                yield -1;// "nLetters" initialized to -1
            }
        };

        System.out.println(nLetters);



    }
}
