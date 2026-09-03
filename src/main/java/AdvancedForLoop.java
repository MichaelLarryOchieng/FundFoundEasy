//Also called for each loop
public class AdvancedForLoop {
    public static void main(String[] args){
        int[] ia = {1,2,3};

        for(int n:ia){
            System.out.println(n);
        }

        //Nested loops

        int [] data = {9, 3, 5, 7};

        System.out.println("[]\t[n]\tHistogram");
        for(int i = 0; i<data.length; i++){
            System.out.println(i);
            System.out.print(i + "\t" + data[i] + "\t");

            for(int j = 0; j<data[i]; j++){
                System.out.print("*");
            }
            System.out.println();
        }

    }
}
